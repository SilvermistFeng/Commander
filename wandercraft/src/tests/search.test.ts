import { describe, expect, it } from "vitest";
import { filterDestinations, searchSuggestions } from "@/lib/search";
import { destination } from "./factories";

const CATALOGUE = [
  destination(),
  destination({
    id: "d2", slug: "lisbon-portugal", name: "Lisbon", country: "Portugal",
    continent: "Europe", summary: "Seven hills of tiled facades above the Tagus.",
    tags: ["Budget-Friendly", "Foodie", "Culture"],
  }),
  destination({
    id: "d3", slug: "queenstown-new-zealand", name: "Queenstown", country: "New Zealand",
    continent: "Oceania", summary: "A lake town ringed by mountains.",
    tags: ["Nature & Hiking", "Trending"],
  }),
];

describe("filterDestinations", () => {
  it("returns everything for an empty query", () => {
    expect(filterDestinations(CATALOGUE, "")).toHaveLength(3);
    expect(filterDestinations(CATALOGUE, "   ")).toHaveLength(3);
  });

  it("matches on city name, case-insensitively", () => {
    expect(filterDestinations(CATALOGUE, "kyoto").map((d) => d.name)).toEqual(["Kyoto"]);
    expect(filterDestinations(CATALOGUE, "KYOTO").map((d) => d.name)).toEqual(["Kyoto"]);
  });

  it("matches on a partial name", () => {
    expect(filterDestinations(CATALOGUE, "queens").map((d) => d.name)).toEqual(["Queenstown"]);
  });

  it("matches on country and continent", () => {
    expect(filterDestinations(CATALOGUE, "portugal").map((d) => d.name)).toEqual(["Lisbon"]);
    expect(filterDestinations(CATALOGUE, "oceania").map((d) => d.name)).toEqual(["Queenstown"]);
  });

  it("matches on words in the summary", () => {
    expect(filterDestinations(CATALOGUE, "tagus").map((d) => d.name)).toEqual(["Lisbon"]);
  });

  it("filters by a single tag", () => {
    expect(filterDestinations(CATALOGUE, "", ["Foodie"]).map((d) => d.name)).toEqual(["Kyoto", "Lisbon"]);
  });

  it("widens rather than narrows when several tags are picked", () => {
    const names = filterDestinations(CATALOGUE, "", ["Foodie", "Nature & Hiking"]).map((d) => d.name);
    expect(names).toEqual(["Kyoto", "Lisbon", "Queenstown"]);
  });

  it("applies the query and the tags together", () => {
    expect(filterDestinations(CATALOGUE, "lisbon", ["Foodie"]).map((d) => d.name)).toEqual(["Lisbon"]);
    expect(filterDestinations(CATALOGUE, "lisbon", ["Nature & Hiking"])).toEqual([]);
  });

  it("returns nothing for a query that matches nothing", () => {
    expect(filterDestinations(CATALOGUE, "antarctica")).toEqual([]);
  });
});

describe("searchSuggestions", () => {
  it("ranks a name that starts with the query above one that merely contains it", () => {
    const catalogue = [
      destination({ id: "a", name: "Porto", country: "Portugal" }),
      destination({ id: "b", name: "Lisbon", country: "Portugal" }),
    ];
    expect(searchSuggestions(catalogue, "port").map((d) => d.name)).toEqual(["Porto", "Lisbon"]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchSuggestions(CATALOGUE, "")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(searchSuggestions(CATALOGUE, "a", 1)).toHaveLength(1);
  });
});
