import { makeId, round2, timeToMinutes } from "./utils";
import { splitEvenly } from "./splits";
import type {
  ActivityDTO,
  CollaboratorDTO,
  DocumentDTO,
  ExpenseDTO,
  PackingItemDTO,
  TripDTO,
} from "@/types";

/**
 * Pure reducers over a TripDTO.
 *
 * A guest applies these in the browser and saves to IndexedDB; a signed-in user
 * hits the API, which applies the equivalent change in Postgres. Keeping the
 * logic here means both paths order, renumber and total things the same way.
 */

export type ActivityInput = Omit<ActivityDTO, "id" | "tripId" | "sortOrder"> & { sortOrder?: number };
export type DocumentInput = Omit<DocumentDTO, "id" | "tripId">;
export type ExpenseInput = Omit<ExpenseDTO, "id" | "tripId" | "splits"> & {
  splitWith: string[];
};
export type PackingInput = Omit<PackingItemDTO, "id" | "tripId" | "sortOrder">;

/** Activities within a day sort by start time, then by explicit order. */
export function sortActivities(activities: ActivityDTO[]): ActivityDTO[] {
  return [...activities].sort(
    (a, b) =>
      a.dayNumber - b.dayNumber ||
      a.sortOrder - b.sortOrder ||
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
}

export function activitiesForDay(trip: TripDTO, dayNumber: number): ActivityDTO[] {
  return sortActivities(trip.activities.filter((a) => a.dayNumber === dayNumber));
}

/** Rewrite sortOrder to 0..n-1 inside each day, so gaps never accumulate. */
export function normaliseOrder(activities: ActivityDTO[]): ActivityDTO[] {
  const byDay = new Map<number, ActivityDTO[]>();
  for (const activity of sortActivities(activities)) {
    const list = byDay.get(activity.dayNumber) ?? [];
    list.push(activity);
    byDay.set(activity.dayNumber, list);
  }
  const out: ActivityDTO[] = [];
  for (const list of byDay.values()) {
    list.forEach((activity, i) => out.push({ ...activity, sortOrder: i }));
  }
  return sortActivities(out);
}

export function addActivity(trip: TripDTO, input: ActivityInput): TripDTO {
  const sameDay = trip.activities.filter((a) => a.dayNumber === input.dayNumber);
  const activity: ActivityDTO = {
    ...input,
    id: makeId("act"),
    tripId: trip.id,
    sortOrder: input.sortOrder ?? sameDay.length,
  };
  return { ...trip, activities: normaliseOrder([...trip.activities, activity]) };
}

export function updateActivity(trip: TripDTO, id: string, patch: Partial<ActivityDTO>): TripDTO {
  return {
    ...trip,
    activities: normaliseOrder(
      trip.activities.map((a) => (a.id === id ? { ...a, ...patch, id: a.id, tripId: a.tripId } : a))
    ),
  };
}

export function deleteActivity(trip: TripDTO, id: string): TripDTO {
  return {
    ...trip,
    activities: normaliseOrder(trip.activities.filter((a) => a.id !== id)),
    // A voucher outlives the activity it was pinned to; it just loses the link.
    documents: trip.documents.map((d) => (d.activityId === id ? { ...d, activityId: null } : d)),
    expenses: trip.expenses.map((e) => (e.activityId === id ? { ...e, activityId: null } : e)),
  };
}

/** Move an activity up or down within its day. */
export function moveActivity(trip: TripDTO, id: string, direction: -1 | 1): TripDTO {
  const activity = trip.activities.find((a) => a.id === id);
  if (!activity) return trip;

  const day = activitiesForDay(trip, activity.dayNumber);
  const index = day.findIndex((a) => a.id === id);
  const target = index + direction;
  if (target < 0 || target >= day.length) return trip;

  const reordered = [...day];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  const orders = new Map(reordered.map((a, i) => [a.id, i]));
  return {
    ...trip,
    activities: sortActivities(
      trip.activities.map((a) => (orders.has(a.id) ? { ...a, sortOrder: orders.get(a.id)! } : a))
    ),
  };
}

/** Drop an activity onto a different day, landing at the end of it. */
export function moveActivityToDay(trip: TripDTO, id: string, dayNumber: number): TripDTO {
  const target = trip.activities.filter((a) => a.dayNumber === dayNumber).length;
  return {
    ...trip,
    activities: normaliseOrder(
      trip.activities.map((a) => (a.id === id ? { ...a, dayNumber, sortOrder: target } : a))
    ),
  };
}

export function addDocument(trip: TripDTO, input: DocumentInput): TripDTO {
  const doc: DocumentDTO = { ...input, id: makeId("doc"), tripId: trip.id };
  return { ...trip, documents: [doc, ...trip.documents] };
}

export function updateDocument(trip: TripDTO, id: string, patch: Partial<DocumentDTO>): TripDTO {
  return {
    ...trip,
    documents: trip.documents.map((d) => (d.id === id ? { ...d, ...patch, id: d.id, tripId: d.tripId } : d)),
  };
}

export function deleteDocument(trip: TripDTO, id: string): TripDTO {
  return { ...trip, documents: trip.documents.filter((d) => d.id !== id) };
}

export function documentsForActivity(trip: TripDTO, activityId: string): DocumentDTO[] {
  return trip.documents.filter((d) => d.activityId === activityId);
}

export function addExpense(trip: TripDTO, input: ExpenseInput): TripDTO {
  const id = makeId("exp");
  const parts = splitEvenly(input.amount, input.splitWith);
  const expense: ExpenseDTO = {
    id,
    tripId: trip.id,
    activityId: input.activityId,
    title: input.title,
    amount: round2(input.amount),
    currency: input.currency,
    category: input.category,
    date: input.date,
    paidById: input.paidById,
    paidByName: input.paidByName,
    splits: parts.map((p) => ({
      id: makeId("spl"),
      expenseId: id,
      userId: null,
      participantName: p.participantName,
      splitAmount: p.splitAmount,
      isSettled: false,
    })),
  };
  return { ...trip, expenses: [expense, ...trip.expenses] };
}

export function deleteExpense(trip: TripDTO, id: string): TripDTO {
  return { ...trip, expenses: trip.expenses.filter((e) => e.id !== id) };
}

/** Mark every share of an expense between two people as settled. */
export function settleBetween(trip: TripDTO, from: string, to: string): TripDTO {
  return {
    ...trip,
    expenses: trip.expenses.map((e) =>
      e.paidByName === to
        ? { ...e, splits: e.splits.map((s) => (s.participantName === from ? { ...s, isSettled: true } : s)) }
        : e
    ),
  };
}

export function addPackingItem(trip: TripDTO, input: PackingInput): TripDTO {
  const item: PackingItemDTO = {
    ...input,
    id: makeId("pack"),
    tripId: trip.id,
    sortOrder: trip.packingItems.length,
  };
  return { ...trip, packingItems: [...trip.packingItems, item] };
}

export function addPackingItems(trip: TripDTO, inputs: PackingInput[]): TripDTO {
  const existing = new Set(trip.packingItems.map((i) => i.title.toLowerCase()));
  const fresh = inputs
    .filter((i) => !existing.has(i.title.toLowerCase()))
    .map((input, idx) => ({
      ...input,
      id: makeId("pack"),
      tripId: trip.id,
      sortOrder: trip.packingItems.length + idx,
    }));
  return { ...trip, packingItems: [...trip.packingItems, ...fresh] };
}

export function updatePackingItem(trip: TripDTO, id: string, patch: Partial<PackingItemDTO>): TripDTO {
  return {
    ...trip,
    packingItems: trip.packingItems.map((i) => (i.id === id ? { ...i, ...patch, id: i.id } : i)),
  };
}

export function deletePackingItem(trip: TripDTO, id: string): TripDTO {
  return { ...trip, packingItems: trip.packingItems.filter((i) => i.id !== id) };
}

export function addCollaborator(
  trip: TripDTO,
  input: { email: string; name: string; role: CollaboratorDTO["role"] }
): TripDTO {
  const existing = trip.collaborators.find((c) => c.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    return {
      ...trip,
      collaborators: trip.collaborators.map((c) => (c.id === existing.id ? { ...c, role: input.role } : c)),
    };
  }
  const collaborator: CollaboratorDTO = {
    id: makeId("col"),
    tripId: trip.id,
    userId: null,
    email: input.email,
    name: input.name || input.email.split("@")[0],
    role: input.role,
    inviteToken: makeId("tok"),
    status: "PENDING",
  };
  return { ...trip, collaborators: [...trip.collaborators, collaborator] };
}

export function removeCollaborator(trip: TripDTO, id: string): TripDTO {
  return { ...trip, collaborators: trip.collaborators.filter((c) => c.id !== id) };
}

/** Everyone who can be picked as a payer or a split participant. */
export function tripParticipants(trip: TripDTO): string[] {
  const names = new Set<string>();
  for (const c of trip.collaborators) names.add(c.name);
  for (const e of trip.expenses) {
    names.add(e.paidByName);
    for (const s of e.splits) names.add(s.participantName);
  }
  return [...names].filter(Boolean).sort();
}
