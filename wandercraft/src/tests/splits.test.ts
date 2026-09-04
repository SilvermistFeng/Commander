import { describe, expect, it } from "vitest";
import { computeBalances, settleDebts, splitEvenly, summariseBudget } from "@/lib/splits";
import { expense } from "./factories";

describe("splitEvenly", () => {
  it("divides cleanly when it can", () => {
    expect(splitEvenly(90, ["Alex", "Sam", "Jo"])).toEqual([
      { participantName: "Alex", splitAmount: 30 },
      { participantName: "Sam", splitAmount: 30 },
      { participantName: "Jo", splitAmount: 30 },
    ]);
  });

  it("never loses a cent to rounding", () => {
    const parts = splitEvenly(10, ["Alex", "Sam", "Jo"]);
    const total = parts.reduce((sum, p) => sum + p.splitAmount, 0);
    expect(Math.round(total * 100)).toBe(1000);
    // The odd cent goes to the first person rather than vanishing.
    expect(parts.map((p) => p.splitAmount)).toEqual([3.34, 3.33, 3.33]);
  });

  it("handles a single person and an empty group", () => {
    expect(splitEvenly(42.5, ["Alex"])).toEqual([{ participantName: "Alex", splitAmount: 42.5 }]);
    expect(splitEvenly(42.5, [])).toEqual([]);
  });
});

describe("computeBalances", () => {
  it("nets what each person paid against what they owe", () => {
    const balances = computeBalances([
      expense("Hotel", 200, "Alex", ["Alex", "Sam"]),
      expense("Dinner", 60, "Sam", ["Alex", "Sam"]),
    ]);

    const alex = balances.find((b) => b.participant === "Alex")!;
    const sam = balances.find((b) => b.participant === "Sam")!;

    expect(alex).toMatchObject({ paid: 200, owed: 130, net: 70 });
    expect(sam).toMatchObject({ paid: 60, owed: 130, net: -70 });
  });

  it("ignores shares that have already been settled", () => {
    const settled = expense("Hotel", 200, "Alex", ["Alex", "Sam"]);
    settled.splits = settled.splits.map((s) =>
      s.participantName === "Sam" ? { ...s, isSettled: true } : s
    );

    const balances = computeBalances([settled]);
    expect(balances.find((b) => b.participant === "Sam")!.owed).toBe(0);
    expect(balances.find((b) => b.participant === "Alex")!.net).toBe(100);
  });

  it("returns nothing when there are no expenses", () => {
    expect(computeBalances([])).toEqual([]);
  });
});

describe("settleDebts", () => {
  it("produces one payment for a simple two-person debt", () => {
    const settlements = settleDebts(
      computeBalances([expense("Hotel", 200, "Alex", ["Alex", "Sam"])])
    );
    expect(settlements).toEqual([{ from: "Sam", to: "Alex", amount: 100 }]);
  });

  it("clears a three-way group in at most n-1 payments", () => {
    const balances = computeBalances([
      expense("Flights", 300, "Alex", ["Alex", "Sam", "Jo"]),
      expense("Villa", 600, "Sam", ["Alex", "Sam", "Jo"]),
      expense("Groceries", 90, "Jo", ["Alex", "Sam", "Jo"]),
    ]);
    const settlements = settleDebts(balances);

    expect(settlements.length).toBeLessThanOrEqual(2);

    // Applying the settlements must bring everyone to zero.
    const net = new Map(balances.map((b) => [b.participant, b.net]));
    for (const s of settlements) {
      net.set(s.from, (net.get(s.from) ?? 0) + s.amount);
      net.set(s.to, (net.get(s.to) ?? 0) - s.amount);
    }
    for (const value of net.values()) expect(Math.abs(value)).toBeLessThan(0.02);
  });

  it("says nothing when everyone is already square", () => {
    const balances = computeBalances([
      expense("Lunch", 40, "Alex", ["Alex", "Sam"]),
      expense("Dinner", 40, "Sam", ["Alex", "Sam"]),
    ]);
    expect(settleDebts(balances)).toEqual([]);
  });

  it("does not raise a payment for a rounding-sized difference", () => {
    const balances = [
      { participant: "Alex", paid: 10, owed: 9.995, net: 0.005 },
      { participant: "Sam", paid: 9.995, owed: 10, net: -0.005 },
    ];
    expect(settleDebts(balances)).toEqual([]);
  });
});

describe("summariseBudget", () => {
  it("totals spend and breaks it down by category", () => {
    const summary = summariseBudget(
      [
        { ...expense("Hotel", 300, "Alex", ["Alex"]), category: "LODGING" },
        { ...expense("Dinner", 100, "Alex", ["Alex"]), category: "FOOD" },
      ],
      1000
    );

    expect(summary.spent).toBe(400);
    expect(summary.remaining).toBe(600);
    expect(summary.percentUsed).toBe(40);
    expect(summary.isOver).toBe(false);
    expect(summary.byCategory[0]).toEqual({ category: "LODGING", amount: 300, percent: 75 });
  });

  it("flags going over budget", () => {
    const summary = summariseBudget([expense("Flights", 1200, "Alex", ["Alex"])], 1000);
    expect(summary.isOver).toBe(true);
    expect(summary.remaining).toBe(-200);
  });

  it("does not divide by zero when no budget is set", () => {
    const summary = summariseBudget([expense("Coffee", 4, "Alex", ["Alex"])], 0);
    expect(summary.percentUsed).toBe(0);
    expect(summary.isOver).toBe(false);
  });
});
