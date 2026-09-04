"use client";

import { useEffect, useMemo, useState } from "react";
import { Luggage, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Checkbox, EmptyState, Progress } from "@/components/ui/Misc";
import { Input, Select } from "@/components/ui/Field";
import { WeatherWidget } from "./WeatherWidget";
import { useToast } from "@/components/ui/Toast";
import { PACKING_CATEGORY_LABEL, packedPercent, suggestPackingList } from "@/lib/packing";
import { tripDayCount } from "@/lib/utils";
import type { ForecastResult } from "@/lib/openMeteo";
import type { TripOp } from "@/lib/tripClient";
import type { PackingCategory, PackingItemDTO, TripDTO } from "@/types";

const CATEGORY_ORDER: PackingCategory[] = ["DOCUMENTS", "CLOTHES", "ELECTRONICS", "TOILETRIES"];

const NO_LOCATION: ForecastResult = {
  available: false,
  reason: "This trip has no location set, so there's nothing to forecast.",
  days: [],
};

export function PackingTab({
  trip,
  onUpdate,
}: {
  trip: TripDTO;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
}) {
  const [fetched, setFetched] = useState<ForecastResult | null>(null);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState<PackingCategory>("CLOTHES");
  const { push } = useToast();

  const hasCoordinates = trip.latitude != null && trip.longitude != null;
  // A trip with no coordinates has a known answer, so it never needs a request.
  const forecast = hasCoordinates ? fetched : NO_LOCATION;

  useEffect(() => {
    if (!hasCoordinates) return;
    let cancelled = false;
    const url = `/api/weather?lat=${trip.latitude}&lon=${trip.longitude}&start=${trip.startDate}&end=${trip.endDate}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: ForecastResult) => {
        if (!cancelled) setFetched(data);
      })
      .catch(() => {
        if (!cancelled) {
          setFetched({ available: false, reason: "Couldn't reach the weather service.", days: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hasCoordinates, trip.latitude, trip.longitude, trip.startDate, trip.endDate]);

  const nights = tripDayCount(trip.startDate, trip.endDate);

  const suggestions = useMemo(() => {
    if (!forecast) return [];
    const existing = new Set(trip.packingItems.map((i) => i.title.toLowerCase()));
    return suggestPackingList(forecast, [], nights).filter((s) => !existing.has(s.title.toLowerCase()));
  }, [forecast, trip.packingItems, nights]);

  const grouped = useMemo(() => {
    const map = new Map<PackingCategory, PackingItemDTO[]>();
    for (const category of CATEGORY_ORDER) map.set(category, []);
    for (const item of trip.packingItems) {
      map.set(item.category, [...(map.get(item.category) ?? []), item]);
    }
    return map;
  }, [trip.packingItems]);

  const percent = packedPercent(trip.packingItems);
  const essentialsLeft = trip.packingItems.filter((i) => i.isEssential && !i.isPacked).length;

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    const title = newItem.trim();
    if (!title) return;
    await onUpdate({
      kind: "addPacking",
      inputs: [{ title, category: newCategory, isPacked: false, isEssential: false }],
    });
    setNewItem("");
  }

  async function applySuggestions() {
    if (suggestions.length === 0) return;
    await onUpdate({
      kind: "addPacking",
      inputs: suggestions.map((s) => ({
        title: s.title,
        category: s.category,
        isPacked: false,
        isEssential: s.isEssential,
      })),
    });
    push(`Added ${suggestions.length} suggested items.`, "success", "Based on the forecast and trip length.");
  }

  return (
    <div className="space-y-5">
      <WeatherWidget forecast={forecast} destinationName={trip.destinationName} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,34%)]">
        <div className="min-w-0 space-y-5">
          <Panel className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-medium tracking-tight">Packing list</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {trip.packingItems.filter((i) => i.isPacked).length} of {trip.packingItems.length} packed
                  {essentialsLeft > 0 ? ` · ${essentialsLeft} essential${essentialsLeft === 1 ? "" : "s"} outstanding` : ""}
                </p>
              </div>
              <span className="tnum font-display text-3xl font-medium">{percent}%</span>
            </div>
            <Progress className="mt-3 h-2.5" value={percent} tone={percent === 100 ? "sage" : "accent"} label="Packed" />
          </Panel>

          <form onSubmit={addItem} className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add something to pack…"
              className="flex-1"
            />
            <Select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as PackingCategory)}
              className="w-auto"
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{PACKING_CATEGORY_LABEL[c]}</option>
              ))}
            </Select>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>

          {trip.packingItems.length === 0 ? (
            <EmptyState
              icon={<Luggage className="h-7 w-7" />}
              title="Nothing on the list yet"
              body="Add items yourself, or let the forecast suggest a starting list."
              action={
                suggestions.length > 0 ? (
                  <Button onClick={applySuggestions}>
                    <Sparkles className="h-4 w-4" />
                    Build a list from the forecast
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {CATEGORY_ORDER.map((category) => {
                const items = grouped.get(category) ?? [];
                if (items.length === 0) return null;
                const done = items.filter((i) => i.isPacked).length;
                return (
                  <div key={category} className="overflow-hidden rounded-xl border border-line bg-surface">
                    <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
                      <h3 className="text-sm font-semibold">{PACKING_CATEGORY_LABEL[category]}</h3>
                      <span className="tnum text-xs text-muted">{done}/{items.length}</span>
                    </div>
                    <ul>
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="group flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0"
                        >
                          <Checkbox
                            checked={item.isPacked}
                            onChange={(next) =>
                              onUpdate({ kind: "updatePacking", id: item.id, patch: { isPacked: next } })
                            }
                            label={
                              <span className={item.isPacked ? "text-muted line-through" : "text-ink"}>
                                {item.title}
                              </span>
                            }
                            className="flex-1"
                          />
                          {item.isEssential ? <Badge tone="accent">Essential</Badge> : null}
                          <button
                            onClick={() => onUpdate({ kind: "deletePacking", id: item.id })}
                            aria-label={`Remove ${item.title}`}
                            className="rounded-md p-1.5 text-muted opacity-0 transition hover:bg-danger-wash hover:text-danger group-hover:opacity-100 focus:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suggestions, each with the reason it's being suggested */}
        <div>
          <Panel className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-medium tracking-tight">Suggested</h3>
                <p className="mt-0.5 text-sm text-muted">
                  {forecast?.available
                    ? "From the forecast and how long you're away."
                    : "From how long you're away."}
                </p>
              </div>
              {suggestions.length > 0 ? (
                <Button variant="secondary" size="sm" onClick={applySuggestions}>
                  Add all
                </Button>
              ) : null}
            </div>

            {suggestions.length === 0 ? (
              <p className="mt-4 rounded-lg border border-sage/25 bg-sage-wash px-3 py-2.5 text-sm text-sage">
                Your list already covers everything we&rsquo;d suggest.
              </p>
            ) : (
              <ul className="mt-4 space-y-1.5">
                {suggestions.slice(0, 14).map((s) => (
                  <li key={s.title}>
                    <button
                      onClick={() =>
                        onUpdate({
                          kind: "addPacking",
                          inputs: [{ title: s.title, category: s.category, isPacked: false, isEssential: s.isEssential }],
                        })
                      }
                      className="flex w-full items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-left transition hover:border-accent hover:bg-accent-wash active:scale-[0.99]"
                    >
                      <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{s.title}</span>
                        {s.reason ? <span className="block text-xs text-muted">{s.reason}</span> : null}
                      </span>
                      {s.isEssential ? <Badge tone="accent">Essential</Badge> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
