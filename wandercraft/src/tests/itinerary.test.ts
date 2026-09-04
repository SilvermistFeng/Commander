import { describe, expect, it } from "vitest";
import {
  activitiesForDay, addActivity, addDocument, deleteActivity,
  moveActivity, moveActivityToDay, normaliseOrder, tripParticipants,
} from "@/lib/tripMutations";
import { buildTripFromDestination } from "@/lib/blueprint";
import { destination, trip } from "./factories";
import type { ActivityDTO } from "@/types";

const activityInput = (name: string, dayNumber = 1) => ({
  dayNumber,
  startTime: null,
  endTime: null,
  category: "SIGHTSEEING" as const,
  name,
  locationName: null,
  address: null,
  latitude: null,
  longitude: null,
  cost: 0,
  currency: "EUR",
  notes: null,
  bookingStatus: "PLANNED" as const,
});

function withActivities(names: string[], dayNumber = 1) {
  return names.reduce((t, name) => addActivity(t, activityInput(name, dayNumber)), trip());
}

describe("addActivity", () => {
  it("appends to the end of the day it belongs to", () => {
    const result = withActivities(["First", "Second", "Third"]);
    expect(activitiesForDay(result, 1).map((a) => a.name)).toEqual(["First", "Second", "Third"]);
    expect(activitiesForDay(result, 1).map((a) => a.sortOrder)).toEqual([0, 1, 2]);
  });

  it("numbers each day independently", () => {
    let t = withActivities(["Day one thing"], 1);
    t = addActivity(t, activityInput("Day two thing", 2));
    expect(activitiesForDay(t, 2)[0].sortOrder).toBe(0);
  });
});

describe("moveActivity", () => {
  it("swaps a card with the one above it", () => {
    const result = moveActivity(withActivities(["A", "B", "C"]), "", 1);
    // Moving a non-existent id is a no-op rather than a crash.
    expect(activitiesForDay(result, 1).map((a) => a.name)).toEqual(["A", "B", "C"]);
  });

  it("moves an activity later and earlier again", () => {
    const start = withActivities(["A", "B", "C"]);
    const b = start.activities.find((a) => a.name === "B")!;

    const later = moveActivity(start, b.id, 1);
    expect(activitiesForDay(later, 1).map((a) => a.name)).toEqual(["A", "C", "B"]);

    const back = moveActivity(later, b.id, -1);
    expect(activitiesForDay(back, 1).map((a) => a.name)).toEqual(["A", "B", "C"]);
  });

  it("won't move the first card up or the last card down", () => {
    const start = withActivities(["A", "B"]);
    const first = start.activities.find((a) => a.name === "A")!;
    const last = start.activities.find((a) => a.name === "B")!;

    expect(activitiesForDay(moveActivity(start, first.id, -1), 1).map((a) => a.name)).toEqual(["A", "B"]);
    expect(activitiesForDay(moveActivity(start, last.id, 1), 1).map((a) => a.name)).toEqual(["A", "B"]);
  });
});

describe("moveActivityToDay", () => {
  it("drops the activity at the end of its new day and closes the gap behind it", () => {
    let t = withActivities(["A", "B"], 1);
    t = addActivity(t, activityInput("C", 2));
    const b = t.activities.find((a) => a.name === "B")!;

    const moved = moveActivityToDay(t, b.id, 2);
    expect(activitiesForDay(moved, 1).map((a) => a.name)).toEqual(["A"]);
    expect(activitiesForDay(moved, 2).map((a) => a.name)).toEqual(["C", "B"]);
    expect(activitiesForDay(moved, 2).map((a) => a.sortOrder)).toEqual([0, 1]);
  });
});

describe("deleteActivity", () => {
  it("removes the card and renumbers what's left", () => {
    const start = withActivities(["A", "B", "C"]);
    const b = start.activities.find((a) => a.name === "B")!;
    const result = deleteActivity(start, b.id);

    expect(activitiesForDay(result, 1).map((a) => a.name)).toEqual(["A", "C"]);
    expect(activitiesForDay(result, 1).map((a) => a.sortOrder)).toEqual([0, 1]);
  });

  it("keeps a linked voucher but drops its link", () => {
    const start = withActivities(["Louvre"]);
    const louvre = start.activities[0];
    const withDoc = addDocument(start, {
      activityId: louvre.id,
      category: "ACTIVITY",
      title: "Louvre entry",
      provider: null,
      confirmationCode: "FR-9982",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      startDate: null,
      endDate: null,
      details: null,
      cost: 0,
      currency: "EUR",
      cancellationDeadline: null,
      notes: null,
    });

    const result = deleteActivity(withDoc, louvre.id);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].activityId).toBeNull();
  });
});

describe("normaliseOrder", () => {
  it("closes gaps left by earlier edits, per day", () => {
    const messy = [
      { dayNumber: 1, sortOrder: 5, name: "A" },
      { dayNumber: 1, sortOrder: 9, name: "B" },
      { dayNumber: 2, sortOrder: 3, name: "C" },
    ].map((a, i) => ({ ...a, id: `a${i}`, tripId: "trip_1" }) as unknown as ActivityDTO);

    const result = normaliseOrder(messy);
    expect(result.filter((a) => a.dayNumber === 1).map((a) => a.sortOrder)).toEqual([0, 1]);
    expect(result.filter((a) => a.dayNumber === 2).map((a) => a.sortOrder)).toEqual([0]);
  });
});

describe("buildTripFromDestination", () => {
  it("clones the blueprint into a real, editable trip", () => {
    const built = buildTripFromDestination(destination(), { ownerId: "guest", isGuest: true });

    expect(built.id.startsWith("guest_")).toBe(true);
    expect(built.isGuest).toBe(true);
    expect(built.destinationName).toBe("Kyoto");
    expect(built.currency).toBe("JPY");
    expect(built.activities).toHaveLength(3);
    // Five day titles at the local daily figure — same currency as the activity costs.
    expect(built.totalBudget).toBe(105000);
  });

  it("numbers cloned activities per day, not across the whole trip", () => {
    const built = buildTripFromDestination(destination(), { ownerId: "guest", isGuest: true });
    expect(built.activities.filter((a) => a.dayNumber === 1).map((a) => a.sortOrder)).toEqual([0, 1]);
    expect(built.activities.filter((a) => a.dayNumber === 2).map((a) => a.sortOrder)).toEqual([0]);
  });

  it("gives a signed-in owner a plain trip id, not a guest one", () => {
    const built = buildTripFromDestination(destination(), { ownerId: "user_1", isGuest: false });
    expect(built.id.startsWith("guest_")).toBe(false);
    expect(built.isGuest).toBe(false);
  });

  it("spans the same number of days as the blueprint", () => {
    const built = buildTripFromDestination(destination(), {
      ownerId: "guest",
      isGuest: true,
      startDate: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(built.startDate.slice(0, 10)).toBe("2026-06-01");
    expect(built.endDate.slice(0, 10)).toBe("2026-06-05");
  });
});

describe("tripParticipants", () => {
  it("gathers everyone who appears as a payer, a split or a collaborator", () => {
    const t = trip({
      collaborators: [
        {
          id: "c1", tripId: "trip_1", userId: null, email: "alex@example.com",
          name: "Alex", role: "OWNER", inviteToken: "tok_1", status: "ACCEPTED",
        },
      ],
      expenses: [
        {
          id: "e1", tripId: "trip_1", activityId: null, title: "Dinner", amount: 40,
          currency: "EUR", category: "FOOD", date: "2026-05-01T00:00:00.000Z",
          paidById: null, paidByName: "Sam",
          splits: [
            { id: "s1", expenseId: "e1", userId: null, participantName: "Sam", splitAmount: 20, isSettled: false },
            { id: "s2", expenseId: "e1", userId: null, participantName: "Jo", splitAmount: 20, isSettled: false },
          ],
        },
      ],
    });

    expect(tripParticipants(t)).toEqual(["Alex", "Jo", "Sam"]);
  });
});
