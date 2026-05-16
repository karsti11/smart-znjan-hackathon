"""
Claude integration for Smart Žnjan.

Two surfaces:
- `classify_issue(...)` — forced tool use that returns IssueClassification (category,
  severity, priority, suggested department, summary). Accepts an optional base64
  image (citizen photo).
- `loyalty_coach(...)` — natural language summary + recommendations for a citizen,
  based on their loyalty events. Returns LoyaltyCoachResponse.

Both have offline fallbacks so the demo works without an ANTHROPIC_API_KEY.
"""
from __future__ import annotations

import base64
import json
import re
from typing import Any

from anthropic import Anthropic

from ..config import settings
from .schema import IssueClassification, LoyaltyCoachResponse, UserOut


# ── Tools ────────────────────────────────────────────────────────────────────

CLASSIFY_TOOL: dict[str, Any] = {
    "name": "classify_issue",
    "description": (
        "Klasificiraj komunalnu prijavu građanina za područje Žnjana u Splitu. "
        "Procijeni kategoriju, ozbiljnost, prioritet 0-100, te koji odjel "
        "Grada Splita treba intervenirati. Sažmi prijavu u jednu rečenicu na hrvatskom."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": [
                    "smeće", "rasvjeta", "vandalizam", "infrastruktura",
                    "zelenilo", "voda", "parking", "buka", "životinje", "ostalo",
                ],
            },
            "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
            "priority_score": {
                "type": "integer", "minimum": 0, "maximum": 100,
                "description": "Numerički prioritet 0-100 (100 = hitno za danas).",
            },
            "suggested_department": {
                "type": "string",
                "description": (
                    "Konkretan odjel/službu Grada Splita: npr. 'Komunalno redarstvo', "
                    "'Čistoća d.o.o.', 'Vodovod i kanalizacija', 'Hortikultura', "
                    "'Javna rasvjeta', 'Parkovi', 'Sportski objekti'."
                ),
            },
            "summary": {
                "type": "string",
                "description": "Jedna rečenica na hrvatskom koja sažima što treba napraviti.",
            },
        },
        "required": ["category", "severity", "priority_score", "suggested_department", "summary"],
    },
}


COACH_TOOL: dict[str, Any] = {
    "name": "loyalty_coach",
    "description": (
        "Sastavi prijateljski sažetak građanske aktivnosti i predloži 2-3 personalizirane "
        "preporuke kako iskoristiti bodove i ostati angažiran u zajednici Žnjana."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "2-3 rečenice sažetka aktivnosti na hrvatskom, drugog lica jednine ('vi').",
            },
            "recommendations": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 2,
                "maxItems": 3,
                "description": "Personalizirane preporuke (npr. 'Iskoristi 200 bodova za sat tenisa')",
            },
            "next_milestone_points": {
                "type": "integer",
                "minimum": 50,
                "description": "Sljedeća prirodna miljokaz-vrijednost bodova (npr. 500, 1000).",
            },
        },
        "required": ["summary", "recommendations", "next_milestone_points"],
    },
}


# ── Iterative learning store (in-memory, demo-grade) ─────────────────────────
#
# Whenever staff overrides AI's classification we record the original description
# + the human-corrected category/severity. The next time `classify_issue` runs:
#   - Claude path: we inject the recent corrections into the system prompt as
#     few-shot expert hints.
#   - Heuristic path: we look for token overlap with a recorded correction and
#     return its corrected values directly (so the demo works without an API key).
#
# Capped at the most recent N entries; module-level so it persists for the life
# of the backend process. Backend restart = clean slate.

_CORRECTIONS: list[dict[str, str]] = []
_CORRECTION_LIMIT = 8


def record_correction(
    *, description: str, ai_category: str, ai_severity: str,
    fixed_category: str, fixed_severity: str, staff_note: str = "",
) -> None:
    _CORRECTIONS.append({
        "description": description.strip(),
        "ai_category": ai_category,
        "ai_severity": ai_severity,
        "fixed_category": fixed_category,
        "fixed_severity": fixed_severity,
        "staff_note": staff_note.strip(),
    })
    # Keep only the newest N
    while len(_CORRECTIONS) > _CORRECTION_LIMIT:
        _CORRECTIONS.pop(0)


def corrections_count() -> int:
    return len(_CORRECTIONS)


def _corrections_prompt_block() -> str:
    if not _CORRECTIONS:
        return ""
    lines = [
        "Nedavni ispravci gradskih stručnjaka — koristi ih kao referencu kad nova prijava sliči na njih:",
    ]
    for c in _CORRECTIONS[-5:]:
        note = f" (napomena: {c['staff_note']})" if c['staff_note'] else ""
        lines.append(
            f"- Opis: \"{c['description'][:160]}\" · AI je rekao {c['ai_category']}/{c['ai_severity']} "
            f"· Točno je {c['fixed_category']}/{c['fixed_severity']}{note}"
        )
    return "\n".join(lines) + "\n\n"


def _tokens(s: str) -> set[str]:
    return {t for t in re.findall(r"[\wčćžšđČĆŽŠĐ]+", s.lower()) if len(t) >= 4}


def _matching_correction(description: str) -> dict[str, str] | None:
    """Return the best-matching correction by token overlap, or None."""
    tokens = _tokens(description)
    if not tokens:
        return None
    best: tuple[int, dict[str, str]] | None = None
    for c in _CORRECTIONS:
        overlap = len(tokens & _tokens(c["description"]))
        if overlap >= 2 and (best is None or overlap > best[0]):
            best = (overlap, c)
    return best[1] if best else None


# ── Fallbacks (no API key) ───────────────────────────────────────────────────

_KEYWORDS = {
    "smeće": ["smeć", "otpad", "kont", "vreć", "đubre", "kanta"],
    "rasvjeta": ["rasvjet", "lamp", "fenjer", "svjetl", "ne radi svjetlo"],
    "vandalizam": ["vandal", "razbij", "graff", "grafit", "uništ"],
    "infrastruktura": ["rup", "asfalt", "tlak", "pločnik", "klup", "kockica"],
    "zelenilo": ["trav", "drvo", "grm", "stab", "park"],
    "voda": ["voda", "puknu", "kanaliz", "izlij", "fontan", "navod"],
    "parking": ["parking", "auto", "vozil", "blok"],
    "buka": ["buka", "glasn", "vik"],
    "životinje": ["pas", "mač", "životinj", "galeb"],
}


def _heuristic_classify(description: str) -> IssueClassification:
    # Iterative learning (offline path): if a recent staff correction looks like
    # this report, use the corrected values directly.
    learned = _matching_correction(description)
    if learned:
        category = learned["fixed_category"]
        severity = learned["fixed_severity"]
    else:
        d = description.lower()
        category = "ostalo"
        for cat, keys in _KEYWORDS.items():
            if any(k in d for k in keys):
                category = cat
                break

        severity = "medium"
        if any(w in d for w in ["hitno", "opasno", "puknu", "krv", "ozlje", "kratak spoj"]):
            severity = "critical"
        elif any(w in d for w in ["danima", "stalno", "veliko", "duboko"]):
            severity = "high"
        elif any(w in d for w in ["malo", "sitno"]):
            severity = "low"

    priority = {"low": 25, "medium": 50, "high": 75, "critical": 95}[severity]

    dept_map = {
        "smeće": "Čistoća d.o.o. Split",
        "rasvjeta": "Javna rasvjeta — Grad Split",
        "vandalizam": "Komunalno redarstvo",
        "infrastruktura": "Komunalno gospodarstvo",
        "zelenilo": "Parkovi i nasadi d.o.o.",
        "voda": "Vodovod i kanalizacija d.o.o.",
        "parking": "Split parking d.o.o.",
        "buka": "Komunalno redarstvo",
        "životinje": "Veterinarska stanica",
        "ostalo": "Komunalno redarstvo",
    }
    return IssueClassification(
        category=category,  # type: ignore[arg-type]
        severity=severity,  # type: ignore[arg-type]
        priority_score=priority,
        suggested_department=dept_map[category],
        summary=f"Prijava ({category}): {description[:80]}",
        ai_grounded=False,
    )


def _heuristic_coach(user: UserOut, events: list[dict[str, Any]]) -> LoyaltyCoachResponse:
    n_reports = sum(1 for e in events if e["kind"] == "report")
    n_reservations = sum(1 for e in events if e["kind"] == "reservation")
    parts: list[str] = []
    if n_reports:
        parts.append(f"poslali ste {n_reports} komunalnih prijava")
    if n_reservations:
        parts.append(f"rezervirali ste {n_reservations} sportskih termina")
    activity = ", ".join(parts) if parts else "tek započinjete s aktivnostima"

    summary = (
        f"Bok {user.name.split()[0]}! Imate {user.points} bodova i "
        f"{activity}. Hvala što doprinosite ljepšem Žnjanu."
    )
    recs: list[str] = []
    if user.points >= 200:
        recs.append("Iskoristite 200 bodova za sat tenisa na terenu Žnjan A.")
    recs.append("Prijavite još jedno smeće na plaži — svaka prijava nosi 30 bodova.")
    if n_reservations == 0:
        recs.append("Probajte rezervirati teren u jutarnjem terminu (popust 20 %).")
    elif user.points >= 500:
        recs.append("Pretvorite 500 bodova u 5 € za parking na Žnjanu.")
    recs = recs[:3]

    nxt = ((user.points // 250) + 1) * 250
    return LoyaltyCoachResponse(
        user=user, summary=summary, recommendations=recs, next_milestone_points=nxt,
    )


# ── Real Claude calls (used when ANTHROPIC_API_KEY is set) ───────────────────


def _client() -> Anthropic:
    return Anthropic(api_key=settings.anthropic_api_key)


def _looks_like_data_url(s: str) -> bool:
    return s.startswith("data:image/") and ";base64," in s


def _split_data_url(s: str) -> tuple[str, str]:
    m = re.match(r"data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", s)
    if not m:
        return "image/jpeg", s
    return m.group(1), m.group(2)


def classify_issue(description: str, location_hint: str, photo_data_url: str | None = None) -> IssueClassification:
    if not settings.has_api_key:
        return _heuristic_classify(description)

    content: list[dict[str, Any]] = []
    if photo_data_url and _looks_like_data_url(photo_data_url):
        media_type, b64 = _split_data_url(photo_data_url)
        try:
            base64.b64decode(b64[:64], validate=True)
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": media_type, "data": b64},
            })
        except Exception:
            pass

    content.append({
        "type": "text",
        "text": (
            f"Lokacija: {location_hint or 'Žnjan, Split (nije precizirano)'}\n"
            f"Opis prijave: {description}\n\n"
            "Pozovi alat classify_issue s odgovarajućim vrijednostima. "
            "Razmotri i sliku ako je priložena."
        ),
    })

    try:
        system_prompt = (
            "Ti si asistent gradske uprave Splita za područje Žnjana. "
            "Cilj ti je brzo i točno klasificirati prijave građana i usmjeriti ih na pravi odjel.\n\n"
            + _corrections_prompt_block()
        )
        msg = _client().messages.create(
            model=settings.anthropic_model,
            max_tokens=1024,
            system=system_prompt,
            tools=[CLASSIFY_TOOL],
            tool_choice={"type": "tool", "name": "classify_issue"},
            messages=[{"role": "user", "content": content}],
        )
        for block in msg.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "classify_issue":
                data = block.input
                return IssueClassification(
                    category=data["category"],
                    severity=data["severity"],
                    priority_score=int(data["priority_score"]),
                    suggested_department=data["suggested_department"],
                    summary=data["summary"],
                    ai_grounded=True,
                )
    except Exception as e:  # pragma: no cover — demo fallback
        print(f"[ai] classify_issue Claude error: {e!r}")

    return _heuristic_classify(description)


def loyalty_coach(user: UserOut, events: list[dict[str, Any]]) -> LoyaltyCoachResponse:
    if not settings.has_api_key:
        return _heuristic_coach(user, events)

    payload = {
        "user": {"name": user.name, "points": user.points, "role": user.role},
        "events": events[-15:],
    }
    try:
        msg = _client().messages.create(
            model=settings.anthropic_model,
            max_tokens=1024,
            system=(
                "Ti si prijateljski coach lojalty programa Smart Žnjan. "
                "Govoriš toplo, kratko i konkretno — bez korporativnog jezika. "
                "1 EUR ≈ 100 bodova. Bodovi se mogu iskoristiti za parking i sportske terene."
            ),
            tools=[COACH_TOOL],
            tool_choice={"type": "tool", "name": "loyalty_coach"},
            messages=[{
                "role": "user",
                "content": "Sastavi coach poruku za korisnika. Podaci:\n" + json.dumps(payload, ensure_ascii=False, default=str),
            }],
        )
        for block in msg.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "loyalty_coach":
                data = block.input
                return LoyaltyCoachResponse(
                    user=user,
                    summary=data["summary"],
                    recommendations=list(data["recommendations"])[:3],
                    next_milestone_points=int(data["next_milestone_points"]),
                )
    except Exception as e:  # pragma: no cover — demo fallback
        print(f"[ai] loyalty_coach Claude error: {e!r}")

    return _heuristic_coach(user, events)
