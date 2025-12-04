import { Device } from "@/domain/models";

export const mockDevices: Device[] = [
  {
    id: "device-001",
    name: "NebulaBook Pro X",
    brand: "BuildIndex Labs",
    modelNumber: "NBX-16",
    releaseDate: "2025-05-01",
    priceUSD: 3299.99,
    modelUrl: "/models/placeholder.glb",
    sketchfabUid: "a3c7d7f8demo00000000000000000000",
    techSpecsId: "TS-NBX-16",
    description: "A fictional workstation laptop used as the initial center body for orbiting spec cards.",
    categories: [
      {
        id: "cat-display-001",
        name: "Display",
        slug: "display",
        summary: "16\" mini-LED 240Hz",
        specs: [
          { key: "panel", label: "Panel", value: "16\" QHD+ mini-LED" },
          { key: "refresh", label: "Refresh", value: "240", unit: "Hz", importance: "primary" },
          { key: "gamut", label: "Gamut", value: "99% DCI-P3" },
        ],
        orbitHint: { radius: 180, speed: 0.7, phase: 0 },
      },
      {
        id: "cat-cpu-001",
        name: "CPU",
        slug: "cpu",
        summary: "Ryzen 9 HX (16c/32t)",
        specs: [
          { key: "model", label: "Model", value: "Ryzen 9 HX" },
          { key: "cores", label: "Cores/Threads", value: "16 / 32", importance: "primary" },
          { key: "boost", label: "Boost", value: "5.4", unit: "GHz" },
        ],
        orbitHint: { radius: 210, speed: 0.9, phase: 45 },
      },
      {
        id: "cat-gpu-001",
        name: "GPU",
        slug: "gpu",
        summary: "RTX 5090 Mobile",
        specs: [
          { key: "chip", label: "Chip", value: "RTX 5090 Mobile" },
          { key: "vram", label: "VRAM", value: "24", unit: "GB", importance: "primary" },
          { key: "tdp", label: "TDP", value: "175W" },
        ],
        orbitHint: { radius: 240, speed: 1, phase: 100 },
      },
      {
        id: "cat-ram-001",
        name: "Memory",
        slug: "ram",
        summary: "64 GB LPDDR5X",
        specs: [
          { key: "capacity", label: "Capacity", value: "64", unit: "GB", importance: "primary" },
          { key: "type", label: "Type", value: "LPDDR5X-8000" },
        ],
        orbitHint: { radius: 175, speed: 0.8, phase: 200 },
      },
      {
        id: "cat-storage-001",
        name: "Storage",
        slug: "storage",
        summary: "4 TB NVMe Gen5",
        specs: [
          { key: "primary", label: "Primary", value: "4 TB PCIe Gen5 NVMe" },
          { key: "expansion", label: "Expansion", value: "Open M.2 slot" },
        ],
        orbitHint: { radius: 205, speed: 0.75, phase: 280 },
      },
      {
        id: "cat-battery-001",
        name: "Battery",
        slug: "battery",
        summary: "108 Wh fast charge",
        specs: [
          { key: "capacity", label: "Capacity", value: "108", unit: "Wh", importance: "primary" },
          { key: "charge", label: "Charge", value: "50% in 30m" },
        ],
        orbitHint: { radius: 160, speed: 0.6, phase: 330 },
      },
    ],
  },
  {
    id: "device-002",
    name: "QuasarStation Mini",
    brand: "BuildIndex Labs",
    modelNumber: "QSM-8",
    releaseDate: "2024-11-15",
    priceUSD: 1899,
    modelUrl: "/models/placeholder.glb",
    sketchfabUid: "731235038f6945d19f10d9331b78ea09",
    techSpecsId: "TS-QSM-8",
    description: "Compact desktop box for edge compute and creative work.",
    categories: [
      {
        id: "cat-cpu-002",
        name: "CPU",
        slug: "cpu",
        summary: "Ryzen 7 9800X3D",
        specs: [
          { key: "model", label: "Model", value: "Ryzen 7 9800X3D" },
          { key: "cores", label: "Cores/Threads", value: "8 / 16", importance: "primary" },
          { key: "boost", label: "Boost", value: "5.2", unit: "GHz" },
        ],
        orbitHint: { radius: 200, speed: 0.85, phase: 15 },
      },
      {
        id: "cat-gpu-002",
        name: "GPU",
        slug: "gpu",
        summary: "RTX 5080",
        specs: [
          { key: "chip", label: "Chip", value: "RTX 5080" },
          { key: "vram", label: "VRAM", value: "20", unit: "GB", importance: "primary" },
          { key: "tdp", label: "TDP", value: "300W" },
        ],
        orbitHint: { radius: 230, speed: 1.05, phase: 80 },
      },
      {
        id: "cat-ram-002",
        name: "Memory",
        slug: "ram",
        summary: "32 GB DDR5",
        specs: [
          { key: "capacity", label: "Capacity", value: "32", unit: "GB", importance: "primary" },
          { key: "type", label: "Type", value: "DDR5-7200" },
        ],
        orbitHint: { radius: 170, speed: 0.7, phase: 170 },
      },
      {
        id: "cat-storage-002",
        name: "Storage",
        slug: "storage",
        summary: "2 TB NVMe Gen4",
        specs: [
          { key: "primary", label: "Primary", value: "2 TB PCIe Gen4 NVMe" },
        ],
        orbitHint: { radius: 190, speed: 0.65, phase: 255 },
      },
      {
        id: "cat-connectivity-002",
        name: "Connectivity",
        slug: "connectivity",
        summary: "Wi-Fi 7 + 10GbE",
        specs: [
          { key: "wifi", label: "Wi-Fi", value: "Wi-Fi 7" },
          { key: "ethernet", label: "Ethernet", value: "10 GbE" },
          { key: "usb", label: "USB", value: "4x USB4" },
        ],
        orbitHint: { radius: 155, speed: 0.6, phase: 320 },
      },
    ],
  },
];

export const defaultDevice = mockDevices[0];
