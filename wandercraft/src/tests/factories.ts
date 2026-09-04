import type { DestinationDTO, DocumentDTO, ExpenseDTO, TripDTO } from "@/types";

/** Small builders so each test states only what it actually cares about. */

export function expense(
  title: string,
  amount: number,
  paidByName: string,
  splitWith: string[],
  overrides: Partial<ExpenseDTO> = {}
): ExpenseDTO {
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / splitWith.length);
  let remainder = cents - base * splitWith.length;

  return {
    id: `exp_${title}`,
    tripId: "trip_1",
    activityId: null,
    title,
    amount,
    currency: "EUR",
    category: "OTHER",
    date: "2026-05-01T00:00:00.000Z",
    paidById: null,
    paidByName,
    splits: splitWith.map((participantName) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      return {
        id: `spl_${title}_${participantName}`,
        expenseId: `exp_${title}`,
        userId: null,
        participantName,
        splitAmount: (base + extra) / 100,
        isSettled: false,
      };
    }),
    ...overrides,
  };
}

export function doc(overrides: Partial<DocumentDTO> = {}): DocumentDTO {
  return {
    id: "doc_1",
    tripId: "trip_1",
    activityId: null,
    category: "HOTEL",
    title: "A hotel",
    provider: null,
    confirmationCode: null,
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
    ...overrides,
  };
}

export function destination(overrides: Partial<DestinationDTO> = {}): DestinationDTO {
  return {
    id: "dest_1",
    slug: "kyoto-japan",
    name: "Kyoto",
    country: "Japan",
    continent: "Asia",
    bestSeason: "Spring",
    avgDailyBudget: 145,
    avgDailyBudgetLocal: 21000,
    currency: "JPY",
    heroImage: "linear-gradient(#fff,#000)",
    summary: "Temples, bamboo and a market street that feeds the city.",
    latitude: 35.0116,
    longitude: 135.7681,
    tags: ["Trending", "Culture", "Foodie"],
    blueprintData: {
      dayTitles: ["Day one", "Day two", "Day three", "Day four", "Day five"],
      activities: [
        {
          day: 1, startTime: "09:00", endTime: "11:00", category: "SIGHTSEEING",
          name: "Fushimi Inari", locationName: "Fushimi Inari Taisha",
          latitude: 34.9671, longitude: 135.7727, cost: 0,
        },
        {
          day: 1, startTime: "12:00", endTime: "13:00", category: "DINING",
          name: "Ramen", locationName: "Gion", latitude: 35.0037, longitude: 135.7752, cost: 1200,
        },
        {
          day: 2, startTime: "08:30", endTime: "10:00", category: "SIGHTSEEING",
          name: "Bamboo grove", locationName: "Arashiyama",
          latitude: 35.017, longitude: 135.672, cost: 0,
        },
      ],
      seasonalTips: ["Book early for blossom season."],
      packingHints: ["Shoes you can slip off"],
    },
    ...overrides,
  };
}

export function trip(overrides: Partial<TripDTO> = {}): TripDTO {
  return {
    id: "trip_1",
    title: "Test trip",
    destinationId: null,
    destinationName: "Lisbon",
    country: "Portugal",
    latitude: 38.7223,
    longitude: -9.1393,
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2026-05-05T00:00:00.000Z",
    coverImage: null,
    travelStyle: null,
    totalBudget: 1000,
    currency: "EUR",
    visibility: "PRIVATE",
    ownerId: "guest",
    isGuest: true,
    activities: [],
    documents: [],
    expenses: [],
    packingItems: [],
    collaborators: [],
    ...overrides,
  };
}
