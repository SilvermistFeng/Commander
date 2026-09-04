import type { PackingCategory } from "@/types";
import type { ForecastResult } from "./openMeteo";

export type PackingSuggestion = {
  category: PackingCategory;
  title: string;
  isEssential: boolean;
  reason?: string;
};

/** Things you need regardless of where you're going. */
const BASE: PackingSuggestion[] = [
  { category: "DOCUMENTS", title: "Passport", isEssential: true },
  { category: "DOCUMENTS", title: "Travel insurance details", isEssential: true },
  { category: "DOCUMENTS", title: "Payment cards + a backup card", isEssential: true },
  { category: "DOCUMENTS", title: "Printed copies of key bookings", isEssential: false },
  { category: "CLOTHES", title: "Underwear and socks", isEssential: true },
  { category: "CLOTHES", title: "Comfortable walking shoes", isEssential: true },
  { category: "CLOTHES", title: "Sleepwear", isEssential: false },
  { category: "ELECTRONICS", title: "Phone + charger", isEssential: true },
  { category: "ELECTRONICS", title: "Power bank", isEssential: false },
  { category: "ELECTRONICS", title: "Travel plug adapter", isEssential: true },
  { category: "ELECTRONICS", title: "Headphones", isEssential: false },
  { category: "TOILETRIES", title: "Toothbrush and toothpaste", isEssential: true },
  { category: "TOILETRIES", title: "Any prescription medication", isEssential: true },
  { category: "TOILETRIES", title: "Deodorant", isEssential: false },
  { category: "TOILETRIES", title: "Small first-aid kit", isEssential: false },
];

/**
 * Add to the base list based on what the forecast actually says, plus whatever
 * the destination blueprint knows that a thermometer doesn't (mosquitoes,
 * modest dress codes, altitude).
 */
export function suggestPackingList(
  forecast: ForecastResult,
  destinationHints: string[] = [],
  tripNights = 5
): PackingSuggestion[] {
  const list: PackingSuggestion[] = [...BASE];
  const seen = new Set(list.map((i) => i.title.toLowerCase()));

  const add = (item: PackingSuggestion) => {
    if (seen.has(item.title.toLowerCase())) return;
    seen.add(item.title.toLowerCase());
    list.push(item);
  };

  // Enough clothes for the trip length, without turning into a laundry list.
  add({
    category: "CLOTHES",
    title: `${Math.min(tripNights + 1, 10)} tops`,
    isEssential: false,
    reason: `${tripNights} nights away`,
  });
  add({
    category: "CLOTHES",
    title: tripNights > 6 ? "Trousers + laundry detergent sheets" : "2 pairs of trousers",
    isEssential: false,
    reason: tripNights > 6 ? "Long enough to need a wash mid-trip" : undefined,
  });

  if (forecast.available && forecast.summary) {
    const { avgHigh, avgLow, rainiestChance, maxWind } = forecast.summary;

    if (avgHigh >= 26) {
      add({ category: "CLOTHES", title: "Lightweight breathable shirts", isEssential: false, reason: `Highs around ${avgHigh}°C` });
      add({ category: "TOILETRIES", title: "High-SPF sunscreen", isEssential: true, reason: `Highs around ${avgHigh}°C` });
      add({ category: "CLOTHES", title: "Sun hat", isEssential: false, reason: "Strong sun expected" });
    }
    if (avgHigh >= 24 && rainiestChance < 50) {
      add({ category: "CLOTHES", title: "Swimwear", isEssential: false, reason: "Warm and mostly dry" });
    }
    if (avgLow <= 12) {
      add({ category: "CLOTHES", title: "Warm mid-layer or fleece", isEssential: true, reason: `Lows around ${avgLow}°C` });
    }
    if (avgLow <= 4) {
      add({ category: "CLOTHES", title: "Insulated coat", isEssential: true, reason: `Lows around ${avgLow}°C` });
      add({ category: "CLOTHES", title: "Gloves, hat and scarf", isEssential: true, reason: "Near or below freezing" });
      add({ category: "TOILETRIES", title: "Lip balm and hand cream", isEssential: false, reason: "Cold, dry air" });
    }
    if (rainiestChance >= 40) {
      add({ category: "CLOTHES", title: "Waterproof jacket", isEssential: true, reason: `${rainiestChance}% chance of rain` });
      add({ category: "ELECTRONICS", title: "Dry bag for electronics", isEssential: false, reason: "Wet forecast" });
    }
    if (rainiestChance >= 60) {
      add({ category: "CLOTHES", title: "Second pair of shoes", isEssential: false, reason: "So one pair can dry out" });
    }
    if (maxWind >= 35) {
      add({ category: "CLOTHES", title: "Windproof shell", isEssential: false, reason: `Gusts up to ${maxWind} km/h` });
    }
    const willSnow = forecast.days.some((d) => d.weatherCode >= 71 && d.weatherCode <= 86);
    if (willSnow) {
      add({ category: "CLOTHES", title: "Waterproof boots with grip", isEssential: true, reason: "Snow in the forecast" });
    }
  }

  for (const hint of destinationHints) {
    add({ category: categoriseHint(hint), title: hint, isEssential: false, reason: "Local knowledge" });
  }

  return list;
}

function categoriseHint(hint: string): PackingCategory {
  const h = hint.toLowerCase();
  if (/passport|visa|card|cash|note|document|ticket|adapter card|istanbulkart/.test(h)) return "DOCUMENTS";
  if (/adapter|charger|phone|camera|power|plug/.test(h)) return "ELECTRONICS";
  if (/sunscreen|repellent|balm|tablet|medic|cream|spf/.test(h)) return "TOILETRIES";
  return "CLOTHES";
}

export const PACKING_CATEGORY_LABEL: Record<PackingCategory, string> = {
  DOCUMENTS: "Documents",
  CLOTHES: "Clothes",
  ELECTRONICS: "Electronics",
  TOILETRIES: "Toiletries",
};

export function packedPercent(items: { isPacked: boolean }[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.isPacked).length / items.length) * 100);
}
