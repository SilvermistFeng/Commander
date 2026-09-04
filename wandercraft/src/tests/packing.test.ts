import { describe, expect, it } from "vitest";
import { packedPercent, suggestPackingList } from "@/lib/packing";
import type { ForecastResult } from "@/lib/openMeteo";

const forecast = (summary: Partial<NonNullable<ForecastResult["summary"]>>, codes: number[] = [1]): ForecastResult => ({
  available: true,
  days: codes.map((weatherCode, i) => ({
    date: `2026-05-0${i + 1}`,
    weatherCode,
    tempMax: summary.avgHigh ?? 20,
    tempMin: summary.avgLow ?? 12,
    precipitationProbability: summary.rainiestChance ?? 0,
    windMax: summary.maxWind ?? 10,
  })),
  summary: {
    avgHigh: summary.avgHigh ?? 20,
    avgLow: summary.avgLow ?? 12,
    rainiestChance: summary.rainiestChance ?? 0,
    maxWind: summary.maxWind ?? 10,
  },
});

const titles = (list: { title: string }[]) => list.map((i) => i.title);

describe("suggestPackingList", () => {
  it("always includes the things you need wherever you go", () => {
    const list = suggestPackingList({ available: false, days: [] });
    expect(titles(list)).toContain("Passport");
    expect(titles(list)).toContain("Travel plug adapter");
  });

  it("suggests sun protection when it's hot", () => {
    const list = suggestPackingList(forecast({ avgHigh: 31, avgLow: 22 }));
    expect(titles(list)).toContain("High-SPF sunscreen");
    expect(titles(list)).toContain("Sun hat");
    expect(titles(list)).toContain("Swimwear");
  });

  it("suggests a coat and gloves when it's near freezing", () => {
    const list = suggestPackingList(forecast({ avgHigh: 3, avgLow: 1 }));
    expect(titles(list)).toContain("Insulated coat");
    expect(titles(list)).toContain("Gloves, hat and scarf");
    expect(titles(list)).not.toContain("Swimwear");
  });

  it("suggests waterproofs when rain is likely", () => {
    const list = suggestPackingList(forecast({ rainiestChance: 70 }));
    expect(titles(list)).toContain("Waterproof jacket");
    expect(titles(list)).toContain("Second pair of shoes");
  });

  it("suggests a windproof shell only when it's genuinely windy", () => {
    expect(titles(suggestPackingList(forecast({ maxWind: 20 })))).not.toContain("Windproof shell");
    expect(titles(suggestPackingList(forecast({ maxWind: 50 })))).toContain("Windproof shell");
  });

  it("suggests boots with grip when snow is forecast", () => {
    const list = suggestPackingList(forecast({ avgHigh: 1, avgLow: -4 }, [73]));
    expect(titles(list)).toContain("Waterproof boots with grip");
  });

  it("scales clothing to the length of the trip", () => {
    expect(titles(suggestPackingList({ available: false, days: [] }, [], 3))).toContain("4 tops");
    expect(titles(suggestPackingList({ available: false, days: [] }, [], 9))).toContain("10 tops");
    // Anything past ten days is a laundry problem, not a packing one.
    expect(titles(suggestPackingList({ available: false, days: [] }, [], 20))).toContain("10 tops");
  });

  it("folds in local knowledge from the destination and never duplicates", () => {
    const list = suggestPackingList({ available: false, days: [] }, ["Insect repellent", "Passport"]);
    expect(titles(list).filter((t) => t === "Passport")).toHaveLength(1);
    const repellent = list.find((i) => i.title === "Insect repellent");
    expect(repellent?.category).toBe("TOILETRIES");
  });
});

describe("packedPercent", () => {
  it("reports progress and copes with an empty list", () => {
    expect(packedPercent([])).toBe(0);
    expect(packedPercent([{ isPacked: true }, { isPacked: false }])).toBe(50);
    expect(packedPercent([{ isPacked: true }, { isPacked: true }])).toBe(100);
  });
});
