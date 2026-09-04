import type { DestinationDTO } from "@/types";

/**
 * The landing page filter. Matching is deliberately loose — someone typing
 * "japan", "kyot" or "foodie" should all land on Kyoto — but a query has to
 * match somewhere real, not just be a substring of the blueprint prose.
 */
export function filterDestinations(
  destinations: DestinationDTO[],
  query: string,
  activeTags: string[] = []
): DestinationDTO[] {
  const q = query.trim().toLowerCase();
  const tags = activeTags.map((t) => t.toLowerCase());

  return destinations.filter((destination) => {
    if (tags.length > 0) {
      const destTags = destination.tags.map((t) => t.toLowerCase());
      // Multiple chips widen the net rather than narrowing it to nothing.
      if (!tags.some((t) => destTags.includes(t))) return false;
    }

    if (!q) return true;

    const haystack = [
      destination.name,
      destination.country,
      destination.continent,
      destination.summary,
      ...destination.tags,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

/** Suggestions for the search box: cities first, then countries. */
export function searchSuggestions(destinations: DestinationDTO[], query: string, limit = 5) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = destinations
    .map((d) => {
      const name = d.name.toLowerCase();
      const country = d.country.toLowerCase();
      let score = -1;
      if (name.startsWith(q)) score = 0;
      else if (name.includes(q)) score = 1;
      else if (country.startsWith(q)) score = 2;
      else if (country.includes(q)) score = 3;
      else if (d.tags.some((t) => t.toLowerCase().includes(q))) score = 4;
      return { d, score };
    })
    .filter((s) => s.score >= 0)
    .sort((a, b) => a.score - b.score || a.d.name.localeCompare(b.d.name));

  return scored.slice(0, limit).map((s) => s.d);
}
