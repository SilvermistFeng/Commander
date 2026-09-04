import { describe, expect, it } from "vitest";
import { cancellationStatus, documentsNeedingAttention } from "@/lib/cancellation";
import { doc } from "./factories";

const NOW = new Date("2026-05-01T12:00:00.000Z");
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

describe("cancellationStatus", () => {
  it("says nothing when a booking has no deadline", () => {
    expect(cancellationStatus(null, NOW).urgency).toBe("none");
    expect(cancellationStatus(undefined, NOW).urgency).toBe("none");
  });

  it("treats an unparseable date as no deadline rather than throwing", () => {
    expect(cancellationStatus("not a date", NOW).urgency).toBe("none");
  });

  it("goes urgent inside 24 hours", () => {
    const status = cancellationStatus(hoursFromNow(6), NOW);
    expect(status.urgency).toBe("urgent");
    expect(status.label).toBe("Cancel free within 6h");
  });

  it("goes soon between 24 and 72 hours", () => {
    expect(cancellationStatus(hoursFromNow(30), NOW).urgency).toBe("soon");
    expect(cancellationStatus(hoursFromNow(71), NOW).urgency).toBe("soon");
    expect(cancellationStatus(hoursFromNow(30), NOW).label).toBe("Cancel free within 1 day");
    expect(cancellationStatus(hoursFromNow(60), NOW).label).toBe("Cancel free within 2 days");
  });

  it("stays safe beyond 72 hours", () => {
    const status = cancellationStatus(hoursFromNow(24 * 10), NOW);
    expect(status.urgency).toBe("safe");
    expect(status.label).toBe("Free cancellation for 10 days");
  });

  it("marks a window that has closed", () => {
    const status = cancellationStatus(hoursFromNow(-1), NOW);
    expect(status.urgency).toBe("passed");
    expect(status.label).toBe("Free cancellation ended");
  });

  it("counts the boundary at exactly 24 hours as urgent, not soon", () => {
    expect(cancellationStatus(hoursFromNow(24), NOW).urgency).toBe("urgent");
  });
});

describe("documentsNeedingAttention", () => {
  it("returns only the closing windows, soonest first", () => {
    const documents = [
      doc({ id: "safe", cancellationDeadline: hoursFromNow(24 * 20) }),
      doc({ id: "soon", cancellationDeadline: hoursFromNow(48) }),
      doc({ id: "urgent", cancellationDeadline: hoursFromNow(4) }),
      doc({ id: "passed", cancellationDeadline: hoursFromNow(-5) }),
      doc({ id: "none" }),
    ];

    expect(documentsNeedingAttention(documents, NOW).map((d) => d.doc.id)).toEqual(["urgent", "soon"]);
  });

  it("returns nothing when every booking is comfortable", () => {
    expect(documentsNeedingAttention([doc({ cancellationDeadline: hoursFromNow(24 * 30) })], NOW)).toEqual([]);
  });
});
