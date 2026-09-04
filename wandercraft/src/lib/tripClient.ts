"use client";

import { isGuestTripId } from "./guestPrefix";
import { loadGuestTrip, saveGuestTrip } from "./storage";
import * as M from "./tripMutations";
import type {
  ActivityDTO, CollaboratorRole, DocumentDTO, PackingItemDTO, TripDTO,
} from "@/types";

/**
 * One data layer for both worlds.
 *
 * A guest trip lives in IndexedDB and mutates through the pure reducers in
 * tripMutations. A saved trip goes to the API, which applies the equivalent
 * change in Postgres and returns the whole trip back. Either way the caller
 * gets a fresh TripDTO and never has to branch on which kind it is.
 */

export type TripOp =
  | { kind: "updateTrip"; patch: Partial<TripDTO> }
  | { kind: "addActivity"; input: M.ActivityInput }
  | { kind: "updateActivity"; id: string; patch: Partial<ActivityDTO> }
  | { kind: "deleteActivity"; id: string }
  | { kind: "moveActivity"; id: string; direction: -1 | 1 }
  | { kind: "moveActivityToDay"; id: string; dayNumber: number }
  | { kind: "addDocument"; input: M.DocumentInput }
  | { kind: "updateDocument"; id: string; patch: Partial<DocumentDTO> }
  | { kind: "deleteDocument"; id: string }
  | { kind: "addExpense"; input: M.ExpenseInput }
  | { kind: "deleteExpense"; id: string }
  | { kind: "settle"; from: string; to: string }
  | { kind: "addPacking"; inputs: M.PackingInput[] }
  | { kind: "updatePacking"; id: string; patch: Partial<PackingItemDTO> }
  | { kind: "deletePacking"; id: string }
  | { kind: "addCollaborator"; email: string; name: string; role: CollaboratorRole }
  | { kind: "updateCollaborator"; id: string; role: CollaboratorRole }
  | { kind: "removeCollaborator"; id: string };

export class TripError extends Error {}

async function call(path: string, init?: RequestInit): Promise<{ trip?: TripDTO; inviteUrl?: string }> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new TripError(json?.error ?? "Something went wrong saving that change.");
  return json;
}

export async function fetchTrip(id: string): Promise<TripDTO | null> {
  if (isGuestTripId(id)) return loadGuestTrip(id);
  try {
    const res = await fetch(`/api/trips/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { trip: TripDTO };
    return json.trip;
  } catch {
    return null;
  }
}

/** Apply an operation locally — the same code path the server mirrors. */
export function applyLocally(trip: TripDTO, op: TripOp): TripDTO {
  switch (op.kind) {
    case "updateTrip": return { ...trip, ...op.patch };
    case "addActivity": return M.addActivity(trip, op.input);
    case "updateActivity": return M.updateActivity(trip, op.id, op.patch);
    case "deleteActivity": return M.deleteActivity(trip, op.id);
    case "moveActivity": return M.moveActivity(trip, op.id, op.direction);
    case "moveActivityToDay": return M.moveActivityToDay(trip, op.id, op.dayNumber);
    case "addDocument": return M.addDocument(trip, op.input);
    case "updateDocument": return M.updateDocument(trip, op.id, op.patch);
    case "deleteDocument": return M.deleteDocument(trip, op.id);
    case "addExpense": return M.addExpense(trip, op.input);
    case "deleteExpense": return M.deleteExpense(trip, op.id);
    case "settle": return M.settleBetween(trip, op.from, op.to);
    case "addPacking": return M.addPackingItems(trip, op.inputs);
    case "updatePacking": return M.updatePackingItem(trip, op.id, op.patch);
    case "deletePacking": return M.deletePackingItem(trip, op.id);
    case "addCollaborator": return M.addCollaborator(trip, op);
    case "updateCollaborator":
      return {
        ...trip,
        collaborators: trip.collaborators.map((c) => (c.id === op.id ? { ...c, role: op.role } : c)),
      };
    case "removeCollaborator": return M.removeCollaborator(trip, op.id);
  }
}

export async function mutateTrip(trip: TripDTO, op: TripOp): Promise<TripDTO> {
  if (trip.isGuest || isGuestTripId(trip.id)) {
    const next = applyLocally(trip, op);
    await saveGuestTrip(next);
    return next;
  }
  return serverMutate(trip, op);
}

async function serverMutate(trip: TripDTO, op: TripOp): Promise<TripDTO> {
  const base = `/api/trips/${trip.id}`;
  const json = (body: unknown) => JSON.stringify(body);

  switch (op.kind) {
    case "updateTrip":
      return required(await call(base, { method: "PATCH", body: json(op.patch) }));

    case "addActivity":
      return required(await call(`${base}/activities`, { method: "POST", body: json(op.input) }));
    case "updateActivity":
      return required(await call(`${base}/activities/${op.id}`, { method: "PATCH", body: json(op.patch) }));
    case "deleteActivity":
      return required(await call(`${base}/activities/${op.id}`, { method: "DELETE" }));

    // Reordering is worked out locally, then the resulting order is persisted
    // in one request rather than one PATCH per card.
    case "moveActivity":
    case "moveActivityToDay": {
      const next = applyLocally(trip, op);
      const order = next.activities.map((a) => ({
        id: a.id,
        dayNumber: a.dayNumber,
        sortOrder: a.sortOrder,
      }));
      return required(await call(`${base}/activities/reorder`, { method: "POST", body: json({ order }) }));
    }

    case "addDocument":
      return required(await call(`${base}/documents`, { method: "POST", body: json(op.input) }));
    case "updateDocument":
      return required(await call(`${base}/documents/${op.id}`, { method: "PATCH", body: json(op.patch) }));
    case "deleteDocument":
      return required(await call(`${base}/documents/${op.id}`, { method: "DELETE" }));

    case "addExpense":
      return required(await call(`${base}/expenses`, { method: "POST", body: json(op.input) }));
    case "deleteExpense":
      return required(await call(`${base}/expenses/${op.id}`, { method: "DELETE" }));
    case "settle":
      return required(await call(`${base}/expenses/settle`, { method: "POST", body: json({ from: op.from, to: op.to }) }));

    case "addPacking":
      return required(await call(`${base}/packing`, { method: "POST", body: json({ items: op.inputs }) }));
    case "updatePacking":
      return required(await call(`${base}/packing/${op.id}`, { method: "PATCH", body: json(op.patch) }));
    case "deletePacking":
      return required(await call(`${base}/packing/${op.id}`, { method: "DELETE" }));

    case "addCollaborator":
      return required(await call(`${base}/collaborators`, { method: "POST", body: json({ email: op.email, role: op.role }) }));
    case "updateCollaborator":
      return required(await call(`${base}/collaborators/${op.id}`, { method: "PATCH", body: json({ role: op.role }) }));
    case "removeCollaborator":
      return required(await call(`${base}/collaborators/${op.id}`, { method: "DELETE" }));
  }
}

function required(result: { trip?: TripDTO }): TripDTO {
  if (!result.trip) throw new TripError("The server didn't return the updated trip.");
  return result.trip;
}

/** Generate a share link for an existing collaborator row. */
export async function createInviteLink(tripId: string, email: string, role: CollaboratorRole) {
  const res = await call(`/api/trips/${tripId}/collaborators`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
  return res;
}
