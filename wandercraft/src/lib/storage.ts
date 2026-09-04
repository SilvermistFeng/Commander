"use client";

import { GUEST_PREFIX, isGuestTripId } from "./guestPrefix";
import type { TripDTO } from "@/types";

/**
 * Guest storage.
 *
 * A trip created before signing in lives entirely in the browser. IndexedDB is
 * used rather than localStorage because the document locker stores ticket files
 * as data URIs, which blow past localStorage's ~5MB ceiling quickly. A small
 * localStorage index mirrors just the ids and titles so the header can render
 * without waiting on an async read.
 */

const DB_NAME = "wandercraft";
const DB_VERSION = 1;
const STORE = "trips";
const INDEX_KEY = "wandercraft.guest.index";

export { GUEST_PREFIX, isGuestTripId };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage write failed."));
    tx.oncomplete = () => db.close();
  });
}

export type GuestTripSummary = { id: string; title: string; destinationName: string; updatedAt: number };

function readIndex(): GuestTripSummary[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as GuestTripSummary[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: GuestTripSummary[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
  } catch {
    /* Private browsing or a full quota — the IndexedDB copy is still authoritative. */
  }
}

export function listGuestTrips(): GuestTripSummary[] {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveGuestTrip(trip: TripDTO): Promise<TripDTO> {
  await withStore("readwrite", (store) => store.put(trip));
  const index = readIndex().filter((e) => e.id !== trip.id);
  index.push({
    id: trip.id,
    title: trip.title,
    destinationName: trip.destinationName,
    updatedAt: Date.now(),
  });
  writeIndex(index);
  return trip;
}

export async function loadGuestTrip(id: string): Promise<TripDTO | null> {
  try {
    const trip = await withStore<TripDTO | undefined>("readonly", (store) => store.get(id));
    return trip ?? null;
  } catch {
    return null;
  }
}

export async function loadAllGuestTrips(): Promise<TripDTO[]> {
  try {
    const db = await openDb();
    return await new Promise<TripDTO[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as TripDTO[]);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

export async function deleteGuestTrip(id: string) {
  try {
    await withStore("readwrite", (store) => store.delete(id));
  } catch {
    /* nothing to remove */
  }
  writeIndex(readIndex().filter((e) => e.id !== id));
}

/** Called once a guest's trips have been written into Postgres. */
export async function clearGuestTrips() {
  try {
    await withStore("readwrite", (store) => store.clear());
  } catch {
    /* ignore */
  }
  writeIndex([]);
}

export function hasGuestTrips() {
  return readIndex().length > 0;
}
