// Re-export the shared Item type so existing imports don't break
export type { Item, SuggestedPot } from "./api";

// Featured carousel order — matches the `featured` flag on the backend.
// The home page picks the first 5 featured plants from the API response.
// This list is the fallback order if the API returns more than 5 featured items.
export const FEATURED_NAMES = [
  "Monstera",
  "Areca Palm",
  "Bamboo Tree",
  "Rubber Plant",
  "Table Flowers",
];

export const sz = (m: number | null) =>
  m == null ? "" : (m < 0.5 ? "Small" : m < 1.2 ? "Medium" : "Large") + " · " + m + " m";

export const fmt = (n: number) => n.toLocaleString("en-US");
