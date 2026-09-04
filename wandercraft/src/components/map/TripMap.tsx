"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { MapPoint } from "./LeafletMap";

// Leaflet reaches for `window` on import, so it can only load in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-2">
      <span className="flex items-center gap-2 text-sm text-muted">
        <MapPin className="h-4 w-4 animate-pulse" />
        Loading map…
      </span>
    </div>
  ),
});

export type { MapPoint };
export { LeafletMap as TripMap };
