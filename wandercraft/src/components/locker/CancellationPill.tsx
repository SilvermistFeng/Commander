"use client";

import { AlertTriangle, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cancellationStatus } from "@/lib/cancellation";

/** The amber/red countdown that stops a free-cancellation window slipping past. */
export function CancellationPill({ deadline }: { deadline: string | null }) {
  const status = cancellationStatus(deadline);
  if (status.urgency === "none") return null;

  if (status.urgency === "urgent") {
    return (
      <Badge tone="danger">
        <AlertTriangle className="h-3 w-3" />
        {status.label}
      </Badge>
    );
  }
  if (status.urgency === "soon") {
    return (
      <Badge tone="amber">
        <Clock className="h-3 w-3" />
        {status.label}
      </Badge>
    );
  }
  if (status.urgency === "passed") {
    return (
      <Badge tone="outline">
        <XCircle className="h-3 w-3" />
        {status.label}
      </Badge>
    );
  }
  return (
    <Badge tone="sage">
      <ShieldCheck className="h-3 w-3" />
      {status.label}
    </Badge>
  );
}
