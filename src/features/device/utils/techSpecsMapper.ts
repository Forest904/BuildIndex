import { SpecCategory, SpecItem } from "@/domain/models";

export interface TechSpecsDetail {
  display?: {
    sizeInches?: number;
    resolution?: string;
    refreshHz?: number;
    panelType?: string;
  };
  cpu?: {
    model?: string;
    cores?: number;
    threads?: number;
    baseGHz?: number;
    boostGHz?: number;
  };
  gpu?: {
    model?: string;
    vramGb?: number;
  };
  memory?: {
    sizeGb?: number;
    type?: string;
  };
  storage?: {
    primary?: string;
  };
  battery?: {
    capacityWh?: number;
    fastCharge?: string;
  };
  connectivity?: {
    wifi?: string;
    ethernet?: string;
  };
  sketchfabUid?: string;
}

const toItem = (
  key: string,
  label: string,
  value?: string | number,
  unit?: string,
  importance?: SpecItem["importance"],
) => {
  if (value === undefined || value === null || value === "") return null;
  const numeric = typeof value === "number";
  const valStr = numeric ? value.toString() : (value as string);
  return { key, label, value: valStr, unit, importance } as SpecItem;
};

export function buildSpecCategoriesFromTechSpecs(detail: TechSpecsDetail): SpecCategory[] {
  const categories: SpecCategory[] = [];

  if (detail.display) {
    const specs = [
      toItem("panel", "Panel", detail.display.panelType),
      toItem("size", "Size", detail.display.sizeInches, "in", "primary"),
      toItem("res", "Resolution", detail.display.resolution),
      toItem("refresh", "Refresh", detail.display.refreshHz, "Hz", "primary"),
    ].filter(Boolean) as SpecItem[];
    if (specs.length) {
      categories.push({
        id: "display-auto",
        name: "Display",
        slug: "display",
        summary: detail.display.refreshHz ? `${detail.display.refreshHz}Hz display` : "Display",
        specs,
      });
    }
  }

  if (detail.cpu) {
    const specs = [
      toItem("model", "Model", detail.cpu.model, undefined, "primary"),
      toItem("cores", "Cores", detail.cpu.cores, undefined, "primary"),
      toItem("threads", "Threads", detail.cpu.threads),
      toItem("boost", "Boost", detail.cpu.boostGHz, "GHz"),
    ].filter(Boolean) as SpecItem[];
    if (specs.length) {
      categories.push({
        id: "cpu-auto",
        name: "CPU",
        slug: "cpu",
        summary: detail.cpu.model ?? "CPU",
        specs,
      });
    }
  }

  if (detail.gpu) {
    const specs = [
      toItem("model", "Model", detail.gpu.model, undefined, "primary"),
      toItem("vram", "VRAM", detail.gpu.vramGb, "GB", "primary"),
    ].filter(Boolean) as SpecItem[];
    if (specs.length) {
      categories.push({
        id: "gpu-auto",
        name: "GPU",
        slug: "gpu",
        summary: detail.gpu.model ?? "GPU",
        specs,
      });
    }
  }

  if (detail.memory) {
    const specs = [
      toItem("capacity", "Capacity", detail.memory.sizeGb, "GB", "primary"),
      toItem("type", "Type", detail.memory.type),
    ].filter(Boolean) as SpecItem[];
    if (specs.length) {
      categories.push({
        id: "ram-auto",
        name: "Memory",
        slug: "ram",
        summary: detail.memory.type ?? "Memory",
        specs,
      });
    }
  }

  if (detail.storage) {
    const specs = [toItem("primary", "Primary", detail.storage.primary)].filter(Boolean) as SpecItem[];
    if (specs.length) {
      categories.push({
        id: "storage-auto",
        name: "Storage",
        slug: "storage",
        summary: detail.storage.primary ?? "Storage",
        specs,
      });
    }
  }

  if (detail.battery) {
    const specs = [
      toItem("capacity", "Capacity", detail.battery.capacityWh, "Wh", "primary"),
      toItem("fastcharge", "Fast charge", detail.battery.fastCharge),
    ].filter(Boolean) as SpecItem[];
    if (specs.length) {
      categories.push({
        id: "battery-auto",
        name: "Battery",
        slug: "battery",
        summary: detail.battery.fastCharge ?? "Battery",
        specs,
      });
    }
  }

  if (detail.connectivity) {
    const specs = [
      toItem("wifi", "Wi-Fi", detail.connectivity.wifi),
      toItem("ethernet", "Ethernet", detail.connectivity.ethernet),
    ].filter(Boolean) as SpecItem[];
    if (specs.length) {
      categories.push({
        id: "connectivity-auto",
        name: "Connectivity",
        slug: "connectivity",
        summary: detail.connectivity.wifi ?? "Connectivity",
        specs,
      });
    }
  }

  return categories;
}
