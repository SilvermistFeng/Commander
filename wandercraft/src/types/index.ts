/**
 * One shared shape for a trip, whether it came from Postgres or from a guest's
 * browser storage. Components never need to know which — that's what makes the
 * "plan first, sign up later" flow possible without duplicating every view.
 */

export type ActivityCategory =
  | "SIGHTSEEING" | "DINING" | "TRANSIT" | "LODGING" | "ACTIVITY" | "REST";
export type BookingStatus = "PLANNED" | "CONFIRMED";
export type DocumentCategory = "FLIGHT" | "HOTEL" | "TRANSIT" | "ACTIVITY" | "VISA_ID";
export type ExpenseCategory =
  | "FOOD" | "LODGING" | "TRANSPORT" | "ACTIVITIES" | "SHOPPING" | "OTHER";
export type PackingCategory = "DOCUMENTS" | "CLOTHES" | "ELECTRONICS" | "TOILETRIES";
export type CollaboratorRole = "OWNER" | "EDITOR" | "VIEWER";
export type InviteStatus = "PENDING" | "ACCEPTED";
export type TripVisibility = "PRIVATE" | "SHARED" | "PUBLIC";

export type ActivityDTO = {
  id: string;
  tripId: string;
  dayNumber: number;
  startTime: string | null;
  endTime: string | null;
  category: ActivityCategory;
  name: string;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cost: number;
  currency: string;
  notes: string | null;
  bookingStatus: BookingStatus;
  sortOrder: number;
};

export type DocumentDTO = {
  id: string;
  tripId: string;
  activityId: string | null;
  category: DocumentCategory;
  title: string;
  provider: string | null;
  confirmationCode: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  startDate: string | null;
  endDate: string | null;
  details: string | null;
  cost: number;
  currency: string;
  cancellationDeadline: string | null;
  notes: string | null;
};

export type ExpenseSplitDTO = {
  id: string;
  expenseId: string;
  userId: string | null;
  participantName: string;
  splitAmount: number;
  isSettled: boolean;
};

export type ExpenseDTO = {
  id: string;
  tripId: string;
  activityId: string | null;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  paidById: string | null;
  paidByName: string;
  splits: ExpenseSplitDTO[];
};

export type PackingItemDTO = {
  id: string;
  tripId: string;
  category: PackingCategory;
  title: string;
  isPacked: boolean;
  isEssential: boolean;
  sortOrder: number;
};

export type CollaboratorDTO = {
  id: string;
  tripId: string;
  userId: string | null;
  email: string;
  name: string;
  role: CollaboratorRole;
  inviteToken: string;
  status: InviteStatus;
};

export type TripDTO = {
  id: string;
  title: string;
  destinationId: string | null;
  destinationName: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  travelStyle: string | null;
  totalBudget: number;
  currency: string;
  visibility: TripVisibility;
  ownerId: string;
  isGuest: boolean;
  activities: ActivityDTO[];
  documents: DocumentDTO[];
  expenses: ExpenseDTO[];
  packingItems: PackingItemDTO[];
  collaborators: CollaboratorDTO[];
};

export type BlueprintActivity = {
  day: number;
  startTime: string;
  endTime: string;
  category: ActivityCategory;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  cost: number;
  notes?: string;
};

export type Blueprint = {
  dayTitles: string[];
  activities: BlueprintActivity[];
  seasonalTips: string[];
  packingHints: string[];
};

export type DestinationDTO = {
  id: string;
  slug: string;
  name: string;
  country: string;
  continent: string;
  bestSeason: string;
  /** USD, so destinations compare like for like on the discovery grid. */
  avgDailyBudget: number;
  /** The same figure in the destination's own currency, used to seed a trip budget. */
  avgDailyBudgetLocal: number;
  currency: string;
  heroImage: string;
  summary: string;
  latitude: number;
  longitude: number;
  tags: string[];
  blueprintData: Blueprint;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  preferredCurrency: string;
  theme: "LIGHT" | "DARK" | "SYSTEM";
};
