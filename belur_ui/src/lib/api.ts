// ─── API client ──────────────────────────────────────────────────────────────
// All communication with the Django backend lives here.
// Base URL is set via NEXT_PUBLIC_API_URL in .env.local (dev) or the host
// environment (production). Falls back to localhost:8000 if not set.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ─── Raw API shapes (what Django actually returns) ────────────────────────────

export type ApiImage = {
  sort_order: number; // 0 = cover, 1–2 = extra angles
  image: string;      // absolute URL (Cloudflare R2 public URL)
};

export type ApiPlantType = {
  name: string;
  slug: string;
};

export type ApiSuggestedPot = {
  id: number;
  name: string;
  local_name: string;
  slug: string;
  price: string;
  size_m: string | null;
  description: string;
  in_stock: boolean;
  featured: boolean;
};

export type ApiPlant = {
  id: number;
  name: string;
  local_name: string;
  slug: string;
  price: string;
  size_m: string | null;
  description: string;
  in_stock: boolean;
  featured: boolean;
  pot_included: boolean;
  type: ApiPlantType;
  suggested_pots: ApiSuggestedPot[];
  // images[] is not in the list serializer yet — wired when backend adds it
};

export type ApiPot = {
  id: number;
  name: string;
  local_name: string;
  slug: string;
  price: string;
  size_m: string | null;
  description: string;
  in_stock: boolean;
  featured: boolean;
  // images[] is not in the list serializer yet — wired when backend adds it
};

export type ApiPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ─── SVG symbol map ───────────────────────────────────────────────────────────
// Maps plant/pot names to the SVG symbol id used as the image fallback.
// When the API returns no images for an item, the UI renders this symbol.
// Add new entries here as new products are added to the backend.
const SVG_SYMBOL_MAP: Record<string, string> = {
  "Monstera":       "monstera",
  "Snake Plant":    "snake",
  "Areca Palm":     "palm",
  "Bamboo Tree":    "bamboo",
  "Olive Tree":     "olive",
  "Table Flowers":  "flowers",
  "Rubber Plant":   "rubber",
  "Hanging Pothos": "pothos",
  // Pots all share the generic pot symbol
  "Stone Round":    "pot",
  "Wide Basin":     "pot",
  "Tall Cylinder":  "pot",
  "Matte White":    "pot",
};

// Pot color hints for the SVG symbol — only used when no real image exists
const POT_COLOR_MAP: Record<string, string> = {
  "Stone Round":   "#c9c6bd",
  "Wide Basin":    "#b7b2a6",
  "Tall Cylinder": "#55585a",
  "Matte White":   "#f1efe8",
};

// ─── Shared Item type (UI-facing) ─────────────────────────────────────────────
// This is what every component in the app works with.
// `imgs` holds up to 3 image URLs from the API (sort_order 0–2).
// If the API returns no images, `imgs` is [] and `img` is "" — both
// components (ItemImage, SlotImage) fall back to the SVG art automatically.
export type Item = {
  id: number;
  k: "plant" | "pot";
  slug: string;
  n: string;       // name
  l: string;       // local_name (Amharic)
  t: string;       // type / category label
  p: number;       // price (ETB)
  s: number | null; // size_m
  d: string;       // description
  g: string[];     // feature tags
  in: number;      // in_stock (1/0 for easy boolean coercion)
  pi?: number;     // pot_included
  featured: boolean;
  a: string;       // SVG symbol id — fallback art
  c?: string;      // pot SVG color — fallback only
  img: string;     // cover image URL (images[0]) — "" if none
  imgs: string[];  // all image URLs sorted by sort_order — [] if none
  // Suggested pots — only populated on plant detail fetch
  suggestedPots?: SuggestedPot[];
};

export type SuggestedPot = {
  id: number;
  name: string;
  slug: string;
  price: number;
  in_stock: boolean;
  a: string;   // SVG symbol fallback
  c?: string;  // SVG color fallback
  img: string; // cover image — "" if none
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapPlant(p: ApiPlant & { images?: ApiImage[] }): Item {
  // images[] not yet in list serializer — will be empty until backend wires it
  const images: ApiImage[] = p.images ?? [];
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: p.id,
    k: "plant",
    slug: p.slug,
    n: p.name,
    l: p.local_name,
    t: p.type.name,
    p: parseFloat(p.price),
    s: p.size_m != null ? parseFloat(p.size_m) : null,
    d: p.description,
    g: buildPlantTags(p),
    in: p.in_stock ? 1 : 0,
    pi: p.pot_included ? 1 : undefined,
    featured: p.featured,
    a: SVG_SYMBOL_MAP[p.name] ?? "monstera",
    img: sorted[0]?.image ?? "",
    imgs: sorted.map((i) => i.image),
    suggestedPots: p.suggested_pots?.map(mapSuggestedPot),
  };
}

function mapPot(p: ApiPot & { images?: ApiImage[] }): Item {
  const images: ApiImage[] = p.images ?? [];
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: p.id,
    k: "pot",
    slug: p.slug,
    n: p.name,
    l: p.local_name,
    t: "Pots",
    p: parseFloat(p.price),
    s: p.size_m != null ? parseFloat(p.size_m) : null,
    d: p.description,
    g: buildPotTags(p),
    in: p.in_stock ? 1 : 0,
    featured: p.featured,
    a: SVG_SYMBOL_MAP[p.name] ?? "pot",
    c: POT_COLOR_MAP[p.name],
    img: sorted[0]?.image ?? "",
    imgs: sorted.map((i) => i.image),
  };
}

function mapSuggestedPot(p: ApiSuggestedPot): SuggestedPot {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: parseFloat(p.price),
    in_stock: p.in_stock,
    a: SVG_SYMBOL_MAP[p.name] ?? "pot",
    c: POT_COLOR_MAP[p.name],
    img: "", // suggested_pots in list serializer has no images yet
  };
}

function buildPlantTags(p: ApiPlant): string[] {
  const tags: string[] = [];
  if (p.pot_included) tags.push("Pot included");
  else tags.push("Pot sold separately");
  if (p.featured) tags.push("Featured");
  return tags;
}

function buildPotTags(p: ApiPot): string[] {
  const tags: string[] = [];
  if (p.featured) tags.push("Featured");
  return tags;
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

export async function fetchPlants(): Promise<Item[]> {
  const res = await fetch(`${BASE}/plants/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch plants: ${res.status}`);
  const data: ApiPaginatedResponse<ApiPlant> = await res.json();
  return data.results.map(mapPlant);
}

export async function fetchPots(): Promise<Item[]> {
  const res = await fetch(`${BASE}/pots/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch pots: ${res.status}`);
  const data: ApiPaginatedResponse<ApiPot> = await res.json();
  return data.results.map(mapPot);
}

export async function fetchPlantBySlug(slug: string): Promise<Item | null> {
  const res = await fetch(`${BASE}/plants/${slug}/`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch plant ${slug}: ${res.status}`);
  const data: ApiPlant = await res.json();
  return mapPlant(data);
}

export async function fetchPotBySlug(slug: string): Promise<Item | null> {
  const res = await fetch(`${BASE}/pots/${slug}/`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch pot ${slug}: ${res.status}`);
  const data: ApiPot = await res.json();
  return mapPot(data);
}
