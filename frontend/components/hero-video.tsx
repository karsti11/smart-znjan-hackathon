"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const VIDEO_URL =
  "https://split.hr/Portals/0/adam/ContentS/nopXn_wCdECfSTxEEs1CRA/Video/ZNJAN_RENDER_VIDEO%20(1).mp4";

/**
 * Fullbleed Žnjan render video, streamed from split.hr (Grad Split public asset,
 * ~69 MB so we avoid bundling it). If the network/CORS blocks it the component
 * silently falls back to the existing gradient background underneath.
 */
export function HeroVideo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <>
      <video
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          "opacity-0 transition-opacity duration-700 ease-out",
          "motion-safe:animate-[hero-pan_48s_ease-in-out_infinite_alternate]",
          className,
        )}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onError={() => setFailed(true)}
        onLoadedData={(e) => { (e.currentTarget as HTMLVideoElement).style.opacity = "1"; }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark gradient overlay for legibility of hero text */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/85 via-ink-900/65 to-ink-800/40 pointer-events-none" />
      {/* Subtle teal sheen so video blends with the Smart Žnjan palette */}
      <div className="absolute inset-0 bg-[radial-gradient(at_70%_30%,rgba(63,213,198,0.18)_0px,transparent_45%)] pointer-events-none" />
    </>
  );
}
