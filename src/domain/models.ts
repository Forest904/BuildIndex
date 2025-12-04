export type SpecCategorySlug =
  | "display"
  | "cpu"
  | "ram"
  | "gpu"
  | "battery"
  | "storage"
  | "ports"
  | "connectivity"
  | "misc";

export type SpecImportance = "primary" | "secondary";

export interface SpecItem {
  key: string;
  label: string;
  value: string;
  unit?: string;
  importance?: SpecImportance;
}

export interface SpecCategory {
  id: string;
  name: string;
  slug: SpecCategorySlug;
  summary?: string;
  specs: SpecItem[];
  orbitHint?: {
    radius: number;
    speed: number;
    phase: number;
  };
}

export interface Device {
  id: string;
  name: string;
  brand?: string;
  modelNumber?: string;
  releaseDate?: string;
  priceUSD?: number;
  imageUrl?: string;
  modelUrl?: string;
  sketchfabUid?: string;
  techSpecsId?: string;
  description?: string;
  categories: SpecCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceSearchResult {
  id: string;
  name: string;
  brand?: string;
  thumbnailUrl?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFavoriteDevice {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: string;
  notes?: string;
}
