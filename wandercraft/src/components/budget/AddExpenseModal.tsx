"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Misc";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_ORDER } from "@/lib/categories";
import { splitEvenly } from "@/lib/splits";
import { formatCurrency, toISODateInput } from "@/lib/utils";
import type { ExpenseCategory, TripDTO } from "@/types";

export type ExpenseDraft = {
  title: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
  paidByName: string;
  splitWith: string[];
  activityId: string;
};

export function AddExpenseModal({
  open,
  trip,
  participants,
  defaultPayer,
  onClose,
  onSave,
}: {
  open: boolean;
  trip: TripDTO;
  participants: string[];
  defaultPayer: string;
  onClose: () => void;
  onSave: (draft: ExpenseDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ExpenseDraft>({
    title: "",
    amount: "",
    category: "FOOD",
    date: toISODateInput(new Date()),
    paidByName: defaultPayer,
    splitWith: participants,
    activityId: "",
  });
  const [newPerson, setNewPerson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const everyone = Array.from(new Set([...participants, draft.paidByName, ...draft.splitWith])).filter(Boolean);
  const amount = Number(draft.amount) || 0;
  const preview = draft.splitWith.length > 0 ? splitEvenly(amount, draft.splitWith) : [];

  function toggleParticipant(name: string) {
    setDraft((d) => ({
      ...d,
      splitWith: d.splitWith.includes(name)
        ? d.splitWith.filter((p) => p !== name)
        : [...d.splitWith, name],
    }));
  }

  function addPerson() {
    const name = newPerson.trim();
    if (!name) return;
    setDraft((d) => ({ ...d, splitWith: [...new Set([...d.splitWith, name])] }));
    setNewPerson("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return setError("What was this for?");
    if (amount <= 0) return setError("Enter an amount greater than zero.");
    if (draft.splitWith.length === 0) return setError("Pick at least one person to split this with.");

    setBusy(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add an expense"
      subtitle="Log what was spent and who it was for — the settlement works itself out."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Add expense</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="What was it for">
          <Input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Dinner at Clube de Fado"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Amount (${trip.currency})`}>
            <Input
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ExpenseCategory }))}
            >
              {EXPENSE_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{EXPENSE_CATEGORIES[c].label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Paid by">
            <Select
              value={draft.paidByName}
              onChange={(e) => setDraft((d) => ({ ...d, paidByName: e.target.value }))}
            >
              {everyone.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Link to an activity" hint="Optional — ties the cost to a moment in the itinerary.">
          <Select
            value={draft.activityId}
            onChange={(e) => setDraft((d) => ({ ...d, activityId: e.target.value }))}
          >
            <option value="">Not linked</option>
            {trip.activities.map((a) => (
              <option key={a.id} value={a.id}>Day {a.dayNumber} — {a.name}</option>
            ))}
          </Select>
        </Field>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Split with</p>
          <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-3.5">
            {everyone.map((name) => {
              const share = preview.find((p) => p.participantName === name);
              return (
                <div key={name} className="flex items-center justify-between gap-3">
                  <Checkbox
                    checked={draft.splitWith.includes(name)}
                    onChange={() => toggleParticipant(name)}
                    label={name}
                  />
                  {share ? (
                    <span className="tnum text-sm text-muted">
                      {formatCurrency(share.splitAmount, trip.currency)}
                    </span>
                  ) : null}
                </div>
              );
            })}

            <div className="flex gap-2 border-t border-line pt-3">
              <Input
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPerson();
                  }
                }}
                placeholder="Add someone else"
                className="h-9"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addPerson}>Add</Button>
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-wash px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
