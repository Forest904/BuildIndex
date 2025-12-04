import { Device } from "@/domain/models";

const TECHSPECS_SEARCH_ENDPOINT = "https://api.techspecs.io/v4/product/search";
const TECHSPECS_DETAIL_ENDPOINT = "https://api.techspecs.io/v4/product"; // detail endpoint expects /:id

export interface TechSpecsMatch {
  id: string;
  title: string;
  brand?: string;
  thumbnail?: string;
}

export interface TechSpecsResponse {
  results: TechSpecsMatch[];
}

export interface TechSpecsDetailResponse {
  id: string;
  title: string;
  brand?: string;
  thumbnail?: string;
  specs?: Record<string, unknown>;
}

function apiHeaders() {
  const apiKey = process.env.TECHSPECS_API_KEY;
  if (!apiKey) {
    throw new Error("TECHSPECS_API_KEY missing");
  }
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };
}

export async function searchTechSpecs(query: string): Promise<TechSpecsResponse> {
  const response = await fetch(`${TECHSPECS_SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}`, {
    headers: apiHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TechSpecs search failed: ${response.status}`);
  }

  return (await response.json()) as TechSpecsResponse;
}

export async function fetchTechSpecsDetail(id: string): Promise<TechSpecsDetailResponse | null> {
  const response = await fetch(`${TECHSPECS_DETAIL_ENDPOINT}/${encodeURIComponent(id)}`, {
    headers: apiHeaders(),
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TechSpecs detail failed: ${response.status}`);
  return (await response.json()) as TechSpecsDetailResponse;
}

export function mergeTechSpecs(device: Device, match?: TechSpecsMatch): Device {
  if (!match) return device;
  return {
    ...device,
    name: match.title || device.name,
    brand: match.brand ?? device.brand,
    imageUrl: match.thumbnail ?? device.imageUrl,
    techSpecsId: match.id,
  };
}
