import { round2 } from "./utils";
import type { ExpenseDTO, ExpenseCategory } from "@/types";

export type Balance = { participant: string; paid: number; owed: number; net: number };
export type Settlement = { from: string; to: string; amount: number };

/**
 * Net position per person: what they paid out, minus what their share of
 * everything comes to. Positive net means the group owes them money.
 */
export function computeBalances(expenses: ExpenseDTO[]): Balance[] {
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  // Everyone involved, so a person who has settled up still shows on the
  // balances panel at zero rather than silently disappearing from the trip.
  const everyone = new Set<string>();

  for (const expense of expenses) {
    const payer = expense.paidByName?.trim();
    if (payer) {
      everyone.add(payer);
      paid.set(payer, (paid.get(payer) ?? 0) + expense.amount);
    }

    for (const split of expense.splits) {
      const person = split.participantName?.trim();
      if (!person) continue;
      everyone.add(person);
      // A settled share is already paid back, so it no longer counts as owed.
      if (split.isSettled) continue;
      owed.set(person, (owed.get(person) ?? 0) + split.splitAmount);
    }
  }
  return [...everyone]
    .map((participant) => {
      const p = round2(paid.get(participant) ?? 0);
      const o = round2(owed.get(participant) ?? 0);
      return { participant, paid: p, owed: o, net: round2(p - o) };
    })
    .sort((a, b) => b.net - a.net);
}

/**
 * Turn those balances into the shortest sensible list of payments.
 *
 * Greedy largest-creditor / largest-debtor matching. It won't always find the
 * theoretical minimum number of transfers (that problem is NP-hard), but it
 * never produces more than n-1 and it's what every splitting app in the wild
 * actually does.
 */
export function settleDebts(balances: Balance[], epsilon = 0.01): Settlement[] {
  const creditors = balances
    .filter((b) => b.net > epsilon)
    .map((b) => ({ name: b.participant, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.net < -epsilon)
    .map((b) => ({ name: b.participant, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = round2(Math.min(credit.amount, debt.amount));

    if (amount > epsilon) {
      settlements.push({ from: debt.name, to: credit.name, amount });
    }

    credit.amount = round2(credit.amount - amount);
    debt.amount = round2(debt.amount - amount);

    if (credit.amount <= epsilon) ci += 1;
    if (debt.amount <= epsilon) di += 1;
  }

  return settlements;
}

/**
 * Divide an amount between people so the parts always add back up to the
 * total. The remainder cents are handed out one at a time from the top rather
 * than lost to rounding.
 */
export function splitEvenly(amount: number, participants: string[]): { participantName: string; splitAmount: number }[] {
  if (participants.length === 0) return [];
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / participants.length);
  let remainder = cents - base * participants.length;

  return participants.map((participantName) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { participantName, splitAmount: round2((base + extra) / 100) };
  });
}

export type BudgetSummary = {
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOver: boolean;
  byCategory: { category: ExpenseCategory; amount: number; percent: number }[];
};

export function summariseBudget(expenses: ExpenseDTO[], totalBudget: number): BudgetSummary {
  const spent = round2(expenses.reduce((sum, e) => sum + e.amount, 0));
  const totals = new Map<ExpenseCategory, number>();
  for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);

  const byCategory = [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount: round2(amount),
      percent: spent > 0 ? Math.round((amount / spent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    budget: round2(totalBudget),
    spent,
    remaining: round2(totalBudget - spent),
    percentUsed: totalBudget > 0 ? Math.min(999, Math.round((spent / totalBudget) * 100)) : 0,
    isOver: spent > totalBudget && totalBudget > 0,
    byCategory,
  };
}
