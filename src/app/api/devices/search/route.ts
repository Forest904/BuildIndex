import { DeviceSearchResult } from "@/domain/models";
import { mockDevices } from "@/features/device/data/mockDevices";
import { searchDevicesFromCsv } from "@/features/device/services/deviceCsvSource";
import { NextRequest, NextResponse } from "next/server";

const takeCount = 8;

function fallbackSearch(query: string, limit: number): DeviceSearchResult[] {
  const normalized = query.toLowerCase();
  return mockDevices
    .filter((device) =>
      `${device.brand ?? ""} ${device.name} ${device.modelNumber ?? ""}`
        .toLowerCase()
        .includes(normalized)
    )
    .slice(0, limit)
    .map((device) => ({
      id: device.id,
      name: device.name,
      brand: device.brand,
      thumbnailUrl: undefined,
    }));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (!query) {
    return NextResponse.json([]);
  }

  const resultsMap = new Map<string, DeviceSearchResult>();

  try {
    const csvResults = await searchDevicesFromCsv(query, takeCount);
    csvResults.forEach((item) => resultsMap.set(item.id, item));
  } catch (error) {
    console.error("devices.csv search failed", error);
  }

  const remaining = Math.max(0, takeCount - resultsMap.size);
  const fallback = fallbackSearch(query, remaining);
  fallback.forEach((item) => resultsMap.set(item.id, item));

  return NextResponse.json(Array.from(resultsMap.values()).slice(0, takeCount));
}
