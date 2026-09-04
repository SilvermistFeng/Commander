"use client";

import { useMemo, useState } from "react";
import { ArrowRight, HandCoins, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, EmptyState, Progress } from "@/components/ui/Misc";
import { AddExpenseModal, type ExpenseDraft } from "./AddExpenseModal";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { computeBalances, settleDebts, summariseBudget } from "@/lib/splits";
import { tripParticipants } from "@/lib/tripMutations";
import { useSession } from "@/components/providers/SessionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TripOp } from "@/lib/tripClient";
import type { TripDTO } from "@/types";

export function BudgetTab({
  trip,
  onUpdate,
}: {
  trip: TripDTO;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const { user } = useSession();

  const budget = useMemo(() => summariseBudget(trip.expenses, trip.totalBudget), [trip]);
  const balances = useMemo(() => computeBalances(trip.expenses), [trip.expenses]);
  const settlements = useMemo(() => settleDebts(balances), [balances]);

  const participants = useMemo(() => {
    const known = tripParticipants(trip);
    return known.length > 0 ? known : [user?.name ?? "You"];
  }, [trip, user]);

  const defaultPayer = user?.name ?? participants[0] ?? "You";

  async function saveExpense(draft: ExpenseDraft) {
    await onUpdate({
      kind: "addExpense",
      input: {
        activityId: draft.activityId || null,
        title: draft.title.trim(),
        amount: Number(draft.amount),
        currency: trip.currency,
        category: draft.category,
        date: new Date(draft.date).toISOString(),
        paidById: null,
        paidByName: draft.paidByName,
        splitWith: draft.splitWith,
      },
    });
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,36%)]">
        <div className="min-w-0 space-y-5">
          {/* Budget vs spent */}
          <Panel className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Spent so far
                </p>
                <p className="tnum mt-1 font-display text-4xl font-medium tracking-tight">
                  {formatCurrency(budget.spent, trip.currency)}
                </p>
                <p className="tnum mt-0.5 text-sm text-muted">
                  of {formatCurrency(budget.budget, trip.currency)} budgeted
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {budget.isOver ? "Over by" : "Left"}
                </p>
                <p
                  className={
                    "tnum mt-1 font-display text-3xl font-medium " +
                    (budget.isOver ? "text-danger" : "text-sage")
                  }
                >
                  {formatCurrency(Math.abs(budget.remaining), trip.currency)}
                </p>
              </div>
            </div>

            <Progress
              className="mt-4 h-2.5"
              value={budget.percentUsed}
              tone={budget.isOver ? "danger" : budget.percentUsed > 80 ? "amber" : "sage"}
              label="Budget used"
            />
            <p className="mt-1.5 tnum text-xs text-muted">{budget.percentUsed}% of the budget used</p>

            {/* Category breakdown, ordered by spend */}
            {budget.byCategory.length > 0 ? (
              <div className="mt-6 space-y-3 border-t border-line pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Where it went
                </p>
                {budget.byCategory.map(({ category, amount, percent }) => (
                  <div key={category} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: EXPENSE_CATEGORIES[category].color }}
                      aria-hidden="true"
                    />
                    <span className="w-32 shrink-0 text-sm text-ink-2">
                      {EXPENSE_CATEGORIES[category].label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, background: EXPENSE_CATEGORIES[category].color }}
                      />
                    </div>
                    <span className="tnum w-24 shrink-0 text-right text-sm font-medium">
                      {formatCurrency(amount, trip.currency)}
                    </span>
                    <span className="tnum w-10 shrink-0 text-right text-xs text-muted">{percent}%</span>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          {/* Expense list */}
          <div>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-medium tracking-tight">Expenses</h2>
                <p className="text-sm text-muted">{trip.expenses.length} logged</p>
              </div>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add expense
              </Button>
            </div>

            {trip.expenses.length === 0 ? (
              <EmptyState
                icon={<Receipt className="h-7 w-7" />}
                title="No expenses yet"
                body="Log what gets spent and WanderCraft works out who owes who at the end."
                action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add the first expense</Button>}
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                {trip.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="group flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: EXPENSE_CATEGORIES[expense.category].color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{expense.title}</p>
                      <p className="text-xs text-muted">
                        {formatDate(expense.date, { day: "numeric", month: "short" })} · paid by{" "}
                        {expense.paidByName} · split {expense.splits.length}{" "}
                        {expense.splits.length === 1 ? "way" : "ways"}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-sm font-semibold">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                    <button
                      onClick={() => onUpdate({ kind: "deleteExpense", id: expense.id })}
                      aria-label={`Delete ${expense.title}`}
                      className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition hover:bg-danger-wash hover:text-danger group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Who owes who */}
        <div className="space-y-5">
          <Panel className="p-5">
            <h2 className="font-display text-xl font-medium tracking-tight">Who owes who</h2>
            <p className="mt-0.5 text-sm text-muted">
              The shortest set of payments that clears every debt.
            </p>

            {settlements.length === 0 ? (
              <div className="mt-4 rounded-xl border border-sage/25 bg-sage-wash px-4 py-5 text-center">
                <HandCoins className="mx-auto h-6 w-6 text-sage" />
                <p className="mt-2 text-sm font-medium text-sage">Everyone&rsquo;s square</p>
                <p className="mt-0.5 text-xs text-ink-2">
                  {trip.expenses.length === 0 ? "Nothing has been spent yet." : "No outstanding balances."}
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {settlements.map((s, i) => (
                  <li
                    key={`${s.from}-${s.to}-${i}`}
                    className="rounded-xl border border-line bg-surface-2 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={s.from} size={26} />
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <Avatar name={s.to} size={26} />
                      <span className="tnum ml-auto text-sm font-semibold">
                        {formatCurrency(s.amount, trip.currency)}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] text-ink-2">
                      <strong className="font-semibold">{s.from}</strong> pays{" "}
                      <strong className="font-semibold">{s.to}</strong>
                    </p>
                    <Button
                      variant="subtle"
                      size="sm"
                      className="mt-2 w-full justify-center"
                      onClick={() => onUpdate({ kind: "settle", from: s.from, to: s.to })}
                    >
                      Mark as settled
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {balances.length > 0 ? (
            <Panel className="p-5">
              <h3 className="font-display text-lg font-medium tracking-tight">Balances</h3>
              <ul className="mt-3 space-y-2.5">
                {balances.map((b) => (
                  <li key={b.participant} className="flex items-center gap-2.5">
                    <Avatar name={b.participant} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.participant}</p>
                      <p className="tnum text-xs text-muted">
                        paid {formatCurrency(b.paid, trip.currency)} · owes{" "}
                        {formatCurrency(b.owed, trip.currency)}
                      </p>
                    </div>
                    <Badge tone={b.net > 0.01 ? "sage" : b.net < -0.01 ? "danger" : "neutral"}>
                      {b.net > 0.01 ? "+" : ""}
                      {formatCurrency(b.net, trip.currency)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>

      {addOpen ? (
        <AddExpenseModal
          open
          trip={trip}
          participants={participants}
          defaultPayer={defaultPayer}
          onClose={() => setAddOpen(false)}
          onSave={saveExpense}
        />
      ) : null}
    </>
  );
}
