import type { DocumentDTO } from "@/types";

export type CancellationUrgency = "none" | "safe" | "soon" | "urgent" | "passed";

export type CancellationStatus = {
  urgency: CancellationUrgency;
  hoursRemaining: number;
  label: string;
};

/**
 * How close a free-cancellation window is to closing.
 *
 * Thresholds are deliberately generous: 72 hours is roughly the point at which
 * you can still change a hotel booking without a scramble, 24 hours is the
 * point at which you need to act today.
 */
export function cancellationStatus(
  deadline: string | Date | null | undefined,
  now: Date = new Date()
): CancellationStatus {
  if (!deadline) return { urgency: "none", hoursRemaining: Infinity, label: "" };

  const due = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (Number.isNaN(due.getTime())) return { urgency: "none", hoursRemaining: Infinity, label: "" };

  const msRemaining = due.getTime() - now.getTime();
  const hoursRemaining = msRemaining / 3_600_000;

  if (msRemaining <= 0) {
    return { urgency: "passed", hoursRemaining, label: "Free cancellation ended" };
  }
  if (hoursRemaining <= 24) {
    const hours = Math.max(1, Math.floor(hoursRemaining));
    return { urgency: "urgent", hoursRemaining, label: `Cancel free within ${hours}h` };
  }
  if (hoursRemaining <= 72) {
    const days = Math.floor(hoursRemaining / 24);
    return {
      urgency: "soon",
      hoursRemaining,
      label: `Cancel free within ${days} day${days === 1 ? "" : "s"}`,
    };
  }

  const days = Math.floor(hoursRemaining / 24);
  return { urgency: "safe", hoursRemaining, label: `Free cancellation for ${days} days` };
}

/** Documents whose cancellation window needs attention, soonest first. */
export function documentsNeedingAttention(documents: DocumentDTO[], now: Date = new Date()) {
  return documents
    .map((doc) => ({ doc, status: cancellationStatus(doc.cancellationDeadline, now) }))
    .filter(({ status }) => status.urgency === "soon" || status.urgency === "urgent")
    .sort((a, b) => a.status.hoursRemaining - b.status.hoursRemaining);
}
