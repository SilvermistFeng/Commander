import { describe, expect, it } from "vitest";
import {
  currentTripDay, dateForDay, formatCurrency, formatFileSize,
  initials, slugify, timeToMinutes, tripDayCount,
} from "@/lib/utils";

describe("tripDayCount", () => {
  it("counts both the first and last day", () => {
    expect(tripDayCount("2026-05-01", "2026-05-05")).toBe(5);
    expect(tripDayCount("2026-05-01", "2026-05-01")).toBe(1);
  });

  it("never returns less than one day, even for reversed dates", () => {
    expect(tripDayCount("2026-05-05", "2026-05-01")).toBe(1);
  });
});

describe("currentTripDay", () => {
  it("gives the day number when today falls inside the trip", () => {
    expect(currentTripDay("2026-05-01", "2026-05-05", new Date("2026-05-03T09:00:00"))).toBe(3);
    expect(currentTripDay("2026-05-01", "2026-05-05", new Date("2026-05-01T23:59:00"))).toBe(1);
  });

  it("returns null outside the trip", () => {
    expect(currentTripDay("2026-05-01", "2026-05-05", new Date("2026-04-30T12:00:00"))).toBeNull();
    expect(currentTripDay("2026-05-01", "2026-05-05", new Date("2026-05-06T00:01:00"))).toBeNull();
  });
});

describe("dateForDay", () => {
  it("maps day one to the start date", () => {
    expect(dateForDay("2026-05-01T00:00:00.000Z", 1).toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(dateForDay("2026-05-01T00:00:00.000Z", 4).toISOString().slice(0, 10)).toBe("2026-05-04");
  });
});

describe("formatCurrency", () => {
  it("drops the decimals for currencies that don't use them", () => {
    expect(formatCurrency(1200, "JPY")).not.toContain(".");
    expect(formatCurrency(12.5, "EUR")).toContain("12.50");
  });

  it("falls back rather than throwing on an unknown currency code", () => {
    expect(formatCurrency(10, "NOTREAL")).toBe("NOTREAL 10.00");
  });
});

describe("timeToMinutes", () => {
  it("converts a clock time to minutes past midnight", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("sorts unscheduled items last", () => {
    expect(timeToMinutes(null)).toBe(Number.MAX_SAFE_INTEGER);
    expect(timeToMinutes("")).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("small helpers", () => {
  it("initials takes at most two letters", () => {
    expect(initials("Alex Rivera")).toBe("AR");
    expect(initials("Sam")).toBe("S");
    expect(initials("Maria del Carmen Ruiz")).toBe("MD");
  });

  it("slugify strips accents and punctuation", () => {
    expect(slugify("Türkiye")).toBe("turkiye");
    expect(slugify("São Paulo!")).toBe("sao-paulo");
  });

  it("formatFileSize picks a sensible unit", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
    expect(formatFileSize(null)).toBe("");
  });
});
