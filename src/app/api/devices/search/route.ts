import { DeviceSearchResult } from "@/domain/models";
import { enrichDeviceFromTechSpecs } from "@/features/device/services/techSpecsEnrichment";
import { mockDevices } from "@/features/device/data/mockDevices";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const takeCount = 8;

function toSearchResults(devices: Array<{ id: string; name: string; brand: string | null; imageUrl: string | null }>): DeviceSearchResult[] {
  return devices.map((device) => ({
    id: device.id,
    name: device.name,
    brand: device.brand ?? undefined,
    thumbnailUrl: device.imageUrl ?? undefined,
  }));
}

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
    const devices = await prisma.device.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { brand: { contains: query } },
          { modelNumber: { contains: query } },
          { techSpecsId: { contains: query } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: takeCount,
      select: {
        id: true,
        name: true,
        brand: true,
        imageUrl: true,
      },
    });

    toSearchResults(devices).forEach((item) => resultsMap.set(item.id, item));
  } catch (error) {
    console.error("/api/devices/search db error", error);
  }

  const remaining = takeCount - resultsMap.size;
  const hasTechSpecs = Boolean(process.env.TECHSPECS_API_KEY);

  if (remaining > 0 && hasTechSpecs) {
    try {
      const enriched = await enrichDeviceFromTechSpecs(query);
      if (enriched) {
        resultsMap.set(enriched.id, {
          id: enriched.id,
          name: enriched.name,
          brand: enriched.brand ?? undefined,
          thumbnailUrl: enriched.imageUrl ?? undefined,
        });
      }
    } catch (error) {
      console.error("TechSpecs enrichment failed", error);
    }
  }

  if (resultsMap.size < takeCount) {
    const fallback = fallbackSearch(query, takeCount - resultsMap.size);
    fallback.forEach((item) => resultsMap.set(item.id, item));
  }

  return NextResponse.json(Array.from(resultsMap.values()).slice(0, takeCount));
}
