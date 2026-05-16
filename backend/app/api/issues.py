from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import Issue, LoyaltyEvent, User
from ..db.session import get_db
from ..engine.ai import classify_issue, corrections_count, record_correction
from ..engine.schema import (
    IssueCreateRequest,
    IssueOut,
    IssueOverrideRequest,
    IssueStatusUpdate,
)
from .common import new_id


router = APIRouter(prefix="/api/v1/issues", tags=["issues"])


SEVERITY_POINTS = {"low": 15, "medium": 30, "high": 40, "critical": 50}


@router.get("/corrections-count")
def get_corrections_count() -> dict[str, int]:
    """How many staff overrides are currently feeding back into the AI."""
    return {"count": corrections_count()}


@router.get("", response_model=list[IssueOut])
def list_issues(status: str | None = None, db: Session = Depends(get_db)) -> list[Issue]:
    q = select(Issue).order_by(Issue.priority_score.desc(), Issue.created_at.desc())
    if status:
        q = q.where(Issue.status == status)
    return list(db.execute(q).scalars())


@router.get("/by-user/{user_id}", response_model=list[IssueOut])
def list_user_issues(user_id: str, db: Session = Depends(get_db)) -> list[Issue]:
    return list(db.execute(
        select(Issue).where(Issue.user_id == user_id).order_by(Issue.created_at.desc())
    ).scalars())


@router.post("", response_model=IssueOut)
def create_issue(req: IssueCreateRequest, db: Session = Depends(get_db)) -> Issue:
    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    classification = classify_issue(
        description=req.description,
        location_hint=req.location_hint,
        photo_data_url=req.photo_data_url,
    )

    points = SEVERITY_POINTS[classification.severity]

    issue = Issue(
        id=new_id("iss"),
        user_id=user.id,
        description=req.description,
        location_hint=req.location_hint,
        photo_data_url=req.photo_data_url,
        category=classification.category,
        severity=classification.severity,
        priority_score=classification.priority_score,
        suggested_department=classification.suggested_department,
        ai_summary=classification.summary,
        ai_grounded=classification.ai_grounded,
        status="open",
        points_awarded=points,
    )
    db.add(issue)
    user.points += points
    db.add(LoyaltyEvent(
        id=new_id("le"), user_id=user.id, kind="report",
        delta_points=points, note=f"Prijava: {classification.category}",
    ))
    db.commit()
    db.refresh(issue)
    return issue


@router.put("/{issue_id}/status", response_model=IssueOut)
def update_status(issue_id: str, body: IssueStatusUpdate, db: Session = Depends(get_db)) -> Issue:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    issue.status = body.status
    db.commit()
    db.refresh(issue)
    return issue


@router.put("/{issue_id}/override", response_model=IssueOut)
def override(issue_id: str, body: IssueOverrideRequest, db: Session = Depends(get_db)) -> Issue:
    """Staff override of AI classification. Mutates the issue and feeds the
    correction back into the in-memory learning store for future requests."""
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    record_correction(
        description=issue.description,
        ai_category=issue.category,
        ai_severity=issue.severity,
        fixed_category=body.category,
        fixed_severity=body.severity,
        staff_note=body.note,
    )
    issue.category = body.category
    issue.severity = body.severity
    issue.priority_score = {"low": 25, "medium": 50, "high": 75, "critical": 95}[body.severity]
    issue.ai_grounded = False  # mark this row as human-curated now
    db.commit()
    db.refresh(issue)
    return issue


@router.post("/{issue_id}/reclassify", response_model=IssueOut)
def reclassify(issue_id: str, db: Session = Depends(get_db)) -> Issue:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    c = classify_issue(issue.description, issue.location_hint, issue.photo_data_url)
    issue.category = c.category
    issue.severity = c.severity
    issue.priority_score = c.priority_score
    issue.suggested_department = c.suggested_department
    issue.ai_summary = c.summary
    issue.ai_grounded = c.ai_grounded
    db.commit()
    db.refresh(issue)
    return issue
