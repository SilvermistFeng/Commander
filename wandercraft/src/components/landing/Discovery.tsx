"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPinned } from "lucide-react";
import { DestinationCard } from "./DestinationCard";
import { DestinationModal } from "./DestinationModal";
import { EmptyState } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/components/providers/SessionProvider";
import { useToast } from "@/components/ui/Toast";
import { filterDestinations } from "@/lib/search";
import { buildTripFromDestination } from "@/lib/blueprint";
import { saveGuestTrip } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { DestinationDTO } from "@/types";

const FILTERS = ["Trending", "Budget-Friendly", "Culture", "Nature & Hiking", "Foodie"];

export function Discovery({ destinations }: { destinations: DestinationDTO[] }) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<DestinationDTO | null>(null);
  const [starting, setStarting] = useState(false);

  const { user } = useSession();
  const { push } = useToast();
  const router = useRouter();

  const results = useMemo(
    () => filterDestinations(destinations, query, activeTags),
    [destinations, query, activeTags]
  );

  function toggleTag(tag: string) {
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  }

  /**
   * The conversion moment. A signed-in user gets a real trip in Postgres; a
   * visitor gets one in their browser and lands on exactly the same screen.
   * Nothing stops to ask them to log in.
   */
  async function startPlanning(destination: DestinationDTO) {
    setStarting(true);
    try {
      if (user) {
        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationSlug: destination.slug }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Couldn't create that trip.");
        router.push(`/trips/${json.trip.id}`);
      } else {
        const trip = buildTripFromDestination(destination, { ownerId: "guest", isGuest: true });
        await saveGuestTrip(trip);
        router.push(`/trips/${trip.id}`);
      }
    } catch (error) {
      setStarting(false);
      push(error instanceof Error ? error.message : "Couldn't start that trip.", "error");
    }
  }

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              No account required
            </p>
            <h1 className="font-display text-[2.6rem] font-medium leading-[1.04] tracking-tight sm:text-6xl">
              Plan the whole trip first.
              <br />
              <span className="italic text-accent">Sign up whenever you like.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Pick a city, open its blueprint, and land inside a working itinerary in one click — map,
              budget, tickets and packing list included.
            </p>
          </div>

          {/* Omnibar */}
          <div className="mt-9 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try Kyoto, Portugal, or “budget”…"
                aria-label="Search destinations"
                className="h-14 w-full rounded-xl border border-line bg-canvas pl-12 pr-11 text-[15px] text-ink shadow-ambient transition placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {FILTERS.map((tag) => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition active:scale-[0.98]",
                      active
                        ? "border-accent bg-accent text-accent-ink"
                        : "border-line bg-canvas text-ink-2 hover:border-line-strong hover:text-ink"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
              {activeTags.length > 0 ? (
                <button
                  onClick={() => setActiveTags([])}
                  className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted transition hover:text-ink"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight">
              {query || activeTags.length > 0 ? "Matching destinations" : "Curated blueprints"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {results.length} {results.length === 1 ? "destination" : "destinations"}
              {query ? ` for “${query}”` : ""}
              {activeTags.length > 0 ? ` · ${activeTags.join(", ")}` : ""}
            </p>
          </div>
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon={<MapPinned className="h-7 w-7" />}
            title="Nothing matches that yet"
            body="Try a different city, country, or clear the filters to see all twelve blueprints."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setActiveTags([]);
                }}
              >
                Show everything
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} onOpen={setSelected} />
            ))}
          </div>
        )}
      </section>

      <DestinationModal
        destination={selected}
        onClose={() => setSelected(null)}
        onStart={startPlanning}
        starting={starting}
      />
    </>
  );
}
