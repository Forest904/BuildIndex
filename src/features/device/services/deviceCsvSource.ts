import { Device, DeviceSearchResult, SpecCategory, SpecItem } from "@/domain/models";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

type CsvDevice = {
  id: string;
  category?: string;
  brand?: string;
  model?: string;
  status?: string;
  price?: string;
  currency?: string;
  release_year?: string;
  cpu_brand?: string;
  cpu_model?: string;
  cpu_cores?: string;
  cpu_threads?: string;
  cpu_clock_ghz?: string;
  gpu_name?: string;
  ram_gb?: string;
  storage_gb?: string;
  storage_type?: string;
  screen_size_in?: string;
  resolution_width?: string;
  resolution_height?: string;
  refresh_rate_hz?: string;
  os?: string;
  touchscreen?: string;
  battery_mah?: string;
  fast_charging_w?: string;
  fast_charging?: string;
  sim_slots?: string;
  network_tech?: string;
  spec_score?: string;
};

const DEVICES_CSV_PATH = path.join(process.cwd(), "datasets", "devices.csv");

let cached: { mtimeMs: number; records: CsvDevice[] } | null = null;

async function loadCsvDevices(): Promise<CsvDevice[]> {
  const stat = await fs.stat(DEVICES_CSV_PATH);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.records;
  }

  const raw = await fs.readFile(DEVICES_CSV_PATH, "utf-8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  }) as CsvDevice[];

  cached = { mtimeMs: stat.mtimeMs, records };
  return records;
}

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? undefined : num;
};

const toBool = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // keep int32
  }
  return Math.abs(hash);
};

const orbitFromId = (id: string) => {
  const hash = hashString(id);
  return {
    radius: 220 + (hash % 160),
    speed: 0.7 + ((hash >> 3) % 40) / 100,
    phase: hash % 360,
  };
};

function buildCategory(id: string, name: string, slug: SpecCategory["slug"], specs: SpecItem[], summary?: string): SpecCategory {
  return {
    id,
    name,
    slug,
    summary,
    specs,
    orbitHint: orbitFromId(id),
  };
}

function buildCategories(device: CsvDevice): SpecCategory[] {
  const categories: SpecCategory[] = [];

  const displaySpecs: SpecItem[] = [];
  if (device.screen_size_in) displaySpecs.push({ key: "size", label: "Size", value: device.screen_size_in, unit: "in", importance: "primary" });
  if (device.resolution_width && device.resolution_height)
    displaySpecs.push({
      key: "resolution",
      label: "Resolution",
      value: `${device.resolution_width} x ${device.resolution_height}`,
      importance: "primary",
    });
  if (device.refresh_rate_hz) displaySpecs.push({ key: "refresh", label: "Refresh", value: device.refresh_rate_hz, unit: "Hz" });
  if (displaySpecs.length) {
    categories.push(buildCategory(`display-${device.id}`, "Display", "display", displaySpecs, displaySpecs[0]?.value));
  }

  const cpuSpecs: SpecItem[] = [];
  if (device.cpu_model) cpuSpecs.push({ key: "model", label: "Model", value: device.cpu_model, importance: "primary" });
  if (device.cpu_brand) cpuSpecs.push({ key: "brand", label: "Brand", value: device.cpu_brand });
  if (device.cpu_cores || device.cpu_threads)
    cpuSpecs.push({
      key: "cores",
      label: "Cores / Threads",
      value: `${device.cpu_cores ?? "?"} / ${device.cpu_threads ?? "?"}`,
      importance: "primary",
    });
  if (device.cpu_clock_ghz) cpuSpecs.push({ key: "clock", label: "Boost", value: device.cpu_clock_ghz, unit: "GHz" });
  if (cpuSpecs.length) {
    categories.push(buildCategory(`cpu-${device.id}`, "CPU", "cpu", cpuSpecs, device.cpu_model ?? "CPU"));
  }

  const gpuSpecs: SpecItem[] = [];
  if (device.gpu_name) gpuSpecs.push({ key: "gpu", label: "GPU", value: device.gpu_name, importance: "primary" });
  if (gpuSpecs.length) {
    categories.push(buildCategory(`gpu-${device.id}`, "GPU", "gpu", gpuSpecs, device.gpu_name));
  }

  const ramSpecs: SpecItem[] = [];
  if (device.ram_gb) ramSpecs.push({ key: "capacity", label: "Memory", value: device.ram_gb, unit: "GB", importance: "primary" });
  if (ramSpecs.length) categories.push(buildCategory(`ram-${device.id}`, "Memory", "ram", ramSpecs, `${device.ram_gb ?? ""} GB RAM`));

  const storageSpecs: SpecItem[] = [];
  if (device.storage_gb)
    storageSpecs.push({ key: "capacity", label: "Storage", value: device.storage_gb, unit: "GB", importance: "primary" });
  if (device.storage_type) storageSpecs.push({ key: "type", label: "Type", value: device.storage_type });
  if (storageSpecs.length) categories.push(buildCategory(`storage-${device.id}`, "Storage", "storage", storageSpecs, storageSpecs[0]?.value));

  const batterySpecs: SpecItem[] = [];
  if (device.battery_mah) batterySpecs.push({ key: "capacity", label: "Capacity", value: device.battery_mah, unit: "mAh", importance: "primary" });
  if (device.fast_charging_w) batterySpecs.push({ key: "fastcharge", label: "Fast charge", value: device.fast_charging_w, unit: "W" });
  const fastChargeBool = toBool(device.fast_charging);
  if (fastChargeBool !== undefined) {
    batterySpecs.push({ key: "supported", label: "Supported", value: fastChargeBool ? "Yes" : "No" });
  }
  if (batterySpecs.length) categories.push(buildCategory(`battery-${device.id}`, "Battery", "battery", batterySpecs, batterySpecs[0]?.value));

  const connectivitySpecs: SpecItem[] = [];
  if (device.network_tech) connectivitySpecs.push({ key: "network", label: "Network", value: device.network_tech });
  if (device.sim_slots) connectivitySpecs.push({ key: "sim", label: "SIM slots", value: device.sim_slots });
  const touchBool = toBool(device.touchscreen);
  if (touchBool !== undefined) connectivitySpecs.push({ key: "touch", label: "Touchscreen", value: touchBool ? "Yes" : "No" });
  if (connectivitySpecs.length)
    categories.push(buildCategory(`connectivity-${device.id}`, "Connectivity", "connectivity", connectivitySpecs, device.network_tech));

  const miscSpecs: SpecItem[] = [];
  if (device.os) miscSpecs.push({ key: "os", label: "OS", value: device.os });
  if (device.category) miscSpecs.push({ key: "type", label: "Type", value: device.category });
  if (device.spec_score) miscSpecs.push({ key: "score", label: "Spec score", value: device.spec_score });
  if (miscSpecs.length) categories.push(buildCategory(`misc-${device.id}`, "Misc", "misc", miscSpecs));

  return categories;
}

function toDevice(record: CsvDevice): Device {
  const name = record.model?.trim() || `Device ${record.id}`;
  const price = toNumber(record.price);
  const releaseYear = Number.parseInt(record.release_year ?? "", 10);

  return {
    id: record.id.toString(),
    name,
    brand: record.brand || undefined,
    modelNumber: record.model || undefined,
    releaseDate: Number.isNaN(releaseYear) ? undefined : `${releaseYear}-01-01`,
    priceUSD: price,
    imageUrl: undefined,
    modelUrl: undefined,
    sketchfabUid: undefined,
    techSpecsId: undefined,
    description: `${record.category ?? "Device"} from devices.csv`,
    categories: buildCategories(record),
  };
}

export async function searchDevicesFromCsv(query: string, limit: number): Promise<DeviceSearchResult[]> {
  const records = await loadCsvDevices();
  const normalized = query.toLowerCase();
  return records
    .filter((device) => {
      const haystack = `${device.brand ?? ""} ${device.model ?? ""} ${device.cpu_model ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, limit)
    .map((device) => ({
      id: device.id.toString(),
      name: device.model ?? `Device ${device.id}`,
      brand: device.brand ?? undefined,
      thumbnailUrl: undefined,
    }));
}

export async function getDeviceFromCsv(id: string): Promise<Device | null> {
  const records = await loadCsvDevices();
  const match = records.find((record) => record.id === id);
  if (!match) return null;
  return toDevice(match);
}

export async function getCsvSummaryById(id: string): Promise<{ id: string; name: string; brand?: string } | null> {
  const records = await loadCsvDevices();
  const match = records.find((record) => record.id === id);
  if (!match) return null;
  return {
    id: match.id.toString(),
    name: match.model ?? `Device ${match.id}`,
    brand: match.brand ?? undefined,
  };
}
