import { Device } from "@/domain/models";
import { fetchTechSpecsDetail, mergeTechSpecs, searchTechSpecs } from "@/features/device/api/techSpecs";
import { buildSpecCategoriesFromTechSpecs, TechSpecsDetail } from "@/features/device/utils/techSpecsMapper";
import prisma from "@/lib/prisma";

function normalizeDetail(detail: { specs?: Record<string, unknown>; thumbnail?: string; sketchfabUid?: string } | null): TechSpecsDetail {
  const specs = detail?.specs ?? {};
  return {
    display: {
      sizeInches: specs.display_size_in ?? specs.display?.size,
      resolution: specs.display_resolution ?? specs.display?.resolution,
      refreshHz: specs.display_refresh_rate ?? specs.display?.refresh_rate,
      panelType: specs.display_panel ?? specs.display?.panel,
    },
    cpu: {
      model: specs.cpu_model ?? specs.cpu?.model,
      cores: specs.cpu_cores ?? specs.cpu?.cores,
      threads: specs.cpu_threads ?? specs.cpu?.threads,
      boostGHz: specs.cpu_boost_clock ?? specs.cpu?.boost_clock,
    },
    gpu: {
      model: specs.gpu_model ?? specs.gpu?.model,
      vramGb: specs.gpu_vram_gb ?? specs.gpu?.vram,
    },
    memory: {
      sizeGb: specs.memory_capacity_gb ?? specs.memory?.capacity,
      type: specs.memory_type ?? specs.memory?.type,
    },
    storage: {
      primary: specs.storage_primary ?? specs.storage?.primary,
      secondary: specs.storage_secondary ?? specs.storage?.secondary,
      lanes: specs.storage_lanes ?? specs.storage?.lanes,
    },
    battery: {
      capacityWh: specs.battery_capacity_wh ?? specs.battery?.capacity,
      fastCharge: specs.battery_fast_charge ?? specs.battery?.fast_charge,
    },
    connectivity: {
      wifi: specs.wifi ?? specs.connectivity?.wifi,
      ethernet: specs.ethernet ?? specs.connectivity?.ethernet,
      bluetooth: specs.bluetooth ?? specs.connectivity?.bluetooth,
    },
    ports: specs.ports_list ?? specs.ports,
    thermals: {
      tdp: specs.tdp ?? specs.thermal?.tdp,
      cooling: specs.cooling ?? specs.thermal?.cooling,
    },
    sketchfabUid: specs.sketchfab_uid ?? detail?.sketchfabUid,
  };
}

export async function enrichDeviceFromTechSpecs(query: string) {
  const response = await searchTechSpecs(query);
  const match = response.results?.[0];
  if (!match) return null;

  const detail = await fetchTechSpecsDetail(match.id);
  const normalizedDetail = detail ? normalizeDetail(detail) : undefined;

  const device = await prisma.device.upsert({
    where: { techSpecsId: match.id },
    update: {
      name: match.title || "TechSpecs device",
      brand: match.brand ?? null,
      techSpecsId: match.id,
      imageUrl: match.thumbnail ?? detail?.thumbnail ?? undefined,
      sketchfabUid: normalizedDetail?.sketchfabUid ?? undefined,
    },
    create: {
      name: match.title || "TechSpecs device",
      brand: match.brand ?? null,
      techSpecsId: match.id,
      imageUrl: match.thumbnail ?? detail?.thumbnail ?? undefined,
      sketchfabUid: normalizedDetail?.sketchfabUid ?? undefined,
    },
  });

  const existingCategories = await prisma.specCategory.count({ where: { deviceId: device.id } });
  if (existingCategories === 0 && normalizedDetail) {
    const categories = buildSpecCategoriesFromTechSpecs(normalizedDetail);
    for (const category of categories) {
      await prisma.specCategory.create({
        data: {
          name: category.name,
          slug: category.slug,
          summary: category.summary ?? undefined,
          orbitRadius: category.orbitHint?.radius ?? null,
          orbitSpeed: category.orbitHint?.speed ?? null,
          orbitPhase: category.orbitHint?.phase ?? null,
          deviceId: device.id,
          specs: {
            create: category.specs.map((spec) => ({
              key: spec.key,
              label: spec.label,
              value: spec.value,
              unit: spec.unit ?? null,
              importance: spec.importance ?? null,
            })),
          },
        },
      });
    }
  }

  return mergeTechSpecs(device as unknown as Device, match);
}
