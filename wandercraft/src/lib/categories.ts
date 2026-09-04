import type { ActivityCategory, DocumentCategory, ExpenseCategory } from "@/types";

/**
 * Category colours are fixed hex rather than theme tokens because Leaflet
 * markers are raw HTML outside React's styling. Each one is legible on both
 * the light and the dark map tiles.
 */
export const ACTIVITY_CATEGORIES: Record<
  ActivityCategory,
  { label: string; color: string; icon: string }
> = {
  SIGHTSEEING: { label: "Sightseeing", color: "#D95338", icon: "camera" },
  DINING: { label: "Food & drink", color: "#B45309", icon: "utensils" },
  TRANSIT: { label: "Getting there", color: "#0F766E", icon: "train" },
  LODGING: { label: "Where you sleep", color: "#2D5A46", icon: "bed" },
  ACTIVITY: { label: "Activity", color: "#4A6FA5", icon: "mountain" },
  REST: { label: "Downtime", color: "#78716C", icon: "coffee" },
};

export const ACTIVITY_CATEGORY_ORDER: ActivityCategory[] = [
  "SIGHTSEEING", "DINING", "ACTIVITY", "TRANSIT", "LODGING", "REST",
];

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; plural: string }> = {
  FLIGHT: { label: "Flight", plural: "Flights" },
  HOTEL: { label: "Hotel", plural: "Hotels" },
  TRANSIT: { label: "Ground transit", plural: "Ground transit" },
  ACTIVITY: { label: "Activity", plural: "Activities" },
  VISA_ID: { label: "Visa / ID", plural: "Visas & IDs" },
};

export const DOCUMENT_CATEGORY_ORDER: DocumentCategory[] = [
  "FLIGHT", "HOTEL", "TRANSIT", "ACTIVITY", "VISA_ID",
];

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; color: string }> = {
  FOOD: { label: "Food & drink", color: "#B45309" },
  LODGING: { label: "Accommodation", color: "#2D5A46" },
  TRANSPORT: { label: "Transport", color: "#0F766E" },
  ACTIVITIES: { label: "Activities", color: "#D95338" },
  SHOPPING: { label: "Shopping", color: "#4A6FA5" },
  OTHER: { label: "Other", color: "#78716C" },
};

export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  "FOOD", "LODGING", "TRANSPORT", "ACTIVITIES", "SHOPPING", "OTHER",
];
