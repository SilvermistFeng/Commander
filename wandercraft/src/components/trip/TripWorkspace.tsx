"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, FileText, Loader2, Luggage, Settings2, Wallet } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { GuestBanner } from "@/components/layout/GuestBanner";
import { TripHeader } from "./TripHeader";
import { ItineraryTab } from "@/components/itinerary/ItineraryTab";
import { LockerTab } from "@/components/locker/LockerTab";
import { BudgetTab } from "@/components/budget/BudgetTab";
import { PackingTab } from "@/components/packing/PackingTab";
import { TripSettingsTab } from "./TripSettingsTab";
import { InviteModal } from "@/components/collaboration/InviteModal";
import { fetchTrip, mutateTrip, type TripOp } from "@/lib/tripClient";
import { useSession } from "@/components/providers/SessionProvider";
import { useAuthModal } from "@/components/providers/AuthProvider";
import { documentsNeedingAttention } from "@/lib/cancellation";
import { currentTripDay, tripDayCount } from "@/lib/utils";
import type { TripDTO } from "@/types";

type TabId = "itinerary" | "locker" | "budget" | "packing" | "settings";

const TAB_IDS: TabId[] = ["itinerary", "locker", "budget", "packing", "settings"];

function readTab(value: string | null): TabId {
  return TAB_IDS.includes(value as TabId) ? (value as TabId) : "itinerary";
}

export function TripWorkspace({ tripId }: { tripId: string }) {
  const searchParams = useSearchParams();

  const [trip, setTrip] = useState<TripDTO | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [activeTab, setActiveTab] = useState<TabId>(() => readTab(searchParams.get("tab")));
  const [activeDay, setActiveDay] = useState(1);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { user } = useSession();
  const { open: openAuth } = useAuthModal();
  const { push } = useToast();
  const router = useRouter();

  const inviteToken = searchParams.get("invite");

  // Load the trip — from IndexedDB for guests, from the API otherwise.
  useEffect(() => {
    let cancelled = false;
    fetchTrip(tripId).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setStatus("missing");
        return;
      }
      setTrip(loaded);
      setStatus("ready");
      setActiveDay(currentTripDay(loaded.startDate, loaded.endDate) ?? 1);
    });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // An invite link either joins you straight away or asks you to sign in first.
  useEffect(() => {
    if (!inviteToken) return;
    if (!user) {
      openAuth({ mode: "signup", reason: "Create an account to join this trip and start editing together." });
      return;
    }
    (async () => {
      const res = await fetch(`/api/invites/${inviteToken}`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        push(json.alreadyJoined ? "You're already on this trip." : "You've joined the trip.", "success");
        router.replace(`/trips/${json.tripId ?? tripId}`);
        const refreshed = await fetchTrip(json.tripId ?? tripId);
        if (refreshed) setTrip(refreshed);
      } else {
        push(json?.error ?? "That invite link didn't work.", "error");
      }
    })();
  }, [inviteToken, user, openAuth, push, router, tripId]);

  /** Every change in every tab funnels through here. */
  const update = useCallback(
    async (op: TripOp) => {
      if (!trip) return;
      const previous = trip;
      setSaving(true);
      // Show the change immediately, roll back if the server disagrees.
      try {
        const next = await mutateTrip(trip, op);
        setTrip(next);
        return next;
      } catch (error) {
        setTrip(previous);
        push(error instanceof Error ? error.message : "Couldn't save that change.", "error");
      } finally {
        setSaving(false);
      }
    },
    [trip, push]
  );

  const dayCount = trip ? tripDayCount(trip.startDate, trip.endDate) : 0;

  const attention = useMemo(
    () => (trip ? documentsNeedingAttention(trip.documents).length : 0),
    [trip]
  );

  const unpacked = useMemo(
    () => (trip ? trip.packingItems.filter((i) => !i.isPacked && i.isEssential).length : 0),
    [trip]
  );

  if (status === "loading") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2.5 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening your trip…
        </span>
      </main>
    );
  }

  if (status === "missing" || !trip) {
    return (
      <main className="mx-auto max-w-lg px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">We couldn&rsquo;t find that trip</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          It may have been created in a different browser, or deleted. Guest trips are stored on the device
          they were made on until you create an account.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => router.push("/")}>Browse destinations</Button>
          {!user ? (
            <Button variant="secondary" onClick={() => openAuth({ mode: "signin" })}>
              Sign in
            </Button>
          ) : null}
        </div>
      </main>
    );
  }

  const tabs = [
    { id: "itinerary", label: "Itinerary", icon: <CalendarRange className="h-4 w-4" /> },
    { id: "locker", label: "Locker", icon: <FileText className="h-4 w-4" />, badge: attention || undefined },
    { id: "budget", label: "Budget & splits", icon: <Wallet className="h-4 w-4" /> },
    { id: "packing", label: "Packing", icon: <Luggage className="h-4 w-4" />, badge: unpacked || undefined },
    { id: "settings", label: "Trip settings", icon: <Settings2 className="h-4 w-4" /> },
  ];

  return (
    <main className="pb-16">
      {trip.isGuest ? <GuestBanner /> : null}

      <TripHeader
        trip={trip}
        dayCount={dayCount}
        saving={saving}
        onJumpToToday={() => {
          const today = currentTripDay(trip.startDate, trip.endDate);
          setActiveTab("itinerary");
          setActiveDay(today ?? 1);
          if (!today) push("Today isn't within these dates — showing day 1.", "info");
        }}
        onShare={() => setInviteOpen(true)}
        onUpdate={update}
      />

      <div className="sticky top-16 z-30 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Tabs items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        {activeTab === "itinerary" ? (
          <ItineraryTab
            trip={trip}
            dayCount={dayCount}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            selectedActivityId={selectedActivityId}
            onSelectActivity={setSelectedActivityId}
            onUpdate={update}
          />
        ) : null}

        {activeTab === "locker" ? (
          <LockerTab
            trip={trip}
            onUpdate={update}
            onGoToActivity={(activityId) => {
              const activity = trip.activities.find((a) => a.id === activityId);
              if (!activity) return;
              setActiveDay(activity.dayNumber);
              setSelectedActivityId(activityId);
              setActiveTab("itinerary");
            }}
          />
        ) : null}

        {activeTab === "budget" ? <BudgetTab trip={trip} onUpdate={update} /> : null}

        {activeTab === "packing" ? <PackingTab trip={trip} onUpdate={update} /> : null}

        {activeTab === "settings" ? <TripSettingsTab trip={trip} onUpdate={update} /> : null}
      </div>

      <InviteModal
        trip={trip}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onUpdate={update}
      />
    </main>
  );
}
