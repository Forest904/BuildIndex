/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const devices = [
  {
    id: "device-001",
    name: "NebulaBook Pro X",
    brand: "BuildIndex Labs",
    modelNumber: "NBX-16",
    releaseDate: "2025-05-01",
    priceUSD: 3299.99,
    imageUrl: null,
    modelUrl: "/models/placeholder.glb",
    sketchfabUid: "a3c7d7f8demo00000000000000000000",
    techSpecsId: "TS-NBX-16",
    description: "A fictional workstation laptop used as the initial center body for orbiting spec cards.",
    categories: [
      {
        name: "Display",
        slug: "display",
        summary: "16\" mini-LED 240Hz",
        orbitHint: { radius: 180, speed: 0.7, phase: 0 },
        specs: [
          { key: "panel", label: "Panel", value: "16\" QHD+ mini-LED" },
          { key: "refresh", label: "Refresh", value: "240", unit: "Hz", importance: "primary" },
          { key: "gamut", label: "Gamut", value: "99% DCI-P3" },
        ],
      },
      {
        name: "CPU",
        slug: "cpu",
        summary: "Ryzen 9 HX (16c/32t)",
        orbitHint: { radius: 210, speed: 0.9, phase: 45 },
        specs: [
          { key: "model", label: "Model", value: "Ryzen 9 HX" },
          { key: "cores", label: "Cores/Threads", value: "16 / 32", importance: "primary" },
          { key: "boost", label: "Boost", value: "5.4", unit: "GHz" },
        ],
      },
      {
        name: "GPU",
        slug: "gpu",
        summary: "RTX 5090 Mobile",
        orbitHint: { radius: 240, speed: 1, phase: 100 },
        specs: [
          { key: "chip", label: "Chip", value: "RTX 5090 Mobile" },
          { key: "vram", label: "VRAM", value: "24", unit: "GB", importance: "primary" },
          { key: "tdp", label: "TDP", value: "175W" },
        ],
      },
      {
        name: "Memory",
        slug: "ram",
        summary: "64 GB LPDDR5X",
        orbitHint: { radius: 175, speed: 0.8, phase: 200 },
        specs: [
          { key: "capacity", label: "Capacity", value: "64", unit: "GB", importance: "primary" },
          { key: "type", label: "Type", value: "LPDDR5X-8000" },
        ],
      },
      {
        name: "Storage",
        slug: "storage",
        summary: "4 TB NVMe Gen5",
        orbitHint: { radius: 205, speed: 0.75, phase: 280 },
        specs: [
          { key: "primary", label: "Primary", value: "4 TB PCIe Gen5 NVMe" },
          { key: "expansion", label: "Expansion", value: "Open M.2 slot" },
        ],
      },
      {
        name: "Battery",
        slug: "battery",
        summary: "108 Wh fast charge",
        orbitHint: { radius: 160, speed: 0.6, phase: 330 },
        specs: [
          { key: "capacity", label: "Capacity", value: "108", unit: "Wh", importance: "primary" },
          { key: "charge", label: "Charge", value: "50% in 30m" },
        ],
      },
    ],
  },
  {
    id: "device-002",
    name: "QuasarStation Mini",
    brand: "BuildIndex Labs",
    modelNumber: "QSM-8",
    releaseDate: "2024-11-15",
    priceUSD: 1899.0,
    imageUrl: null,
    modelUrl: "/models/placeholder.glb",
    sketchfabUid: "731235038f6945d19f10d9331b78ea09",
    techSpecsId: "TS-QSM-8",
    description: "Compact desktop box for edge compute and creative work.",
    categories: [
      {
        name: "CPU",
        slug: "cpu",
        summary: "Ryzen 7 9800X3D",
        orbitHint: { radius: 200, speed: 0.85, phase: 15 },
        specs: [
          { key: "model", label: "Model", value: "Ryzen 7 9800X3D" },
          { key: "cores", label: "Cores/Threads", value: "8 / 16", importance: "primary" },
          { key: "boost", label: "Boost", value: "5.2", unit: "GHz" },
        ],
      },
      {
        name: "GPU",
        slug: "gpu",
        summary: "RTX 5080",
        orbitHint: { radius: 230, speed: 1.05, phase: 80 },
        specs: [
          { key: "chip", label: "Chip", value: "RTX 5080" },
          { key: "vram", label: "VRAM", value: "20", unit: "GB", importance: "primary" },
          { key: "tdp", label: "TDP", value: "300W" },
        ],
      },
      {
        name: "Memory",
        slug: "ram",
        summary: "32 GB DDR5",
        orbitHint: { radius: 170, speed: 0.7, phase: 170 },
        specs: [
          { key: "capacity", label: "Capacity", value: "32", unit: "GB", importance: "primary" },
          { key: "type", label: "Type", value: "DDR5-7200" },
        ],
      },
      {
        name: "Storage",
        slug: "storage",
        summary: "2 TB NVMe Gen4",
        orbitHint: { radius: 190, speed: 0.65, phase: 255 },
        specs: [
          { key: "primary", label: "Primary", value: "2 TB PCIe Gen4 NVMe" },
        ],
      },
      {
        name: "Connectivity",
        slug: "connectivity",
        summary: "Wi-Fi 7 + 10GbE",
        orbitHint: { radius: 155, speed: 0.6, phase: 320 },
        specs: [
          { key: "wifi", label: "Wi-Fi", value: "Wi-Fi 7" },
          { key: "ethernet", label: "Ethernet", value: "10 GbE" },
          { key: "usb", label: "USB", value: "4x USB4" },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding database with demo data...");

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@buildindex.io" },
    update: {},
    create: {
      email: "demo@buildindex.io",
      username: "demo",
      passwordHash: "$2b$10$wlKM6u7xSzhcnpApdqnuBuwwB2YMTpGr1SQHrvgLKtF2vOw9d8LH6" // demo1234
    },
  });

  for (const device of devices) {
    const deviceRecord = await prisma.device.upsert({
      where: { id: device.id },
      update: {
        name: device.name,
        brand: device.brand,
        modelNumber: device.modelNumber,
        releaseDate: device.releaseDate ? new Date(device.releaseDate) : null,
        priceUSD: device.priceUSD,
        imageUrl: device.imageUrl,
        modelUrl: device.modelUrl,
        sketchfabUid: device.sketchfabUid,
        techSpecsId: device.techSpecsId,
        description: device.description,
      },
      create: {
        id: device.id,
        name: device.name,
        brand: device.brand,
        modelNumber: device.modelNumber,
        releaseDate: device.releaseDate ? new Date(device.releaseDate) : null,
        priceUSD: device.priceUSD,
        imageUrl: device.imageUrl,
        modelUrl: device.modelUrl,
        sketchfabUid: device.sketchfabUid,
        techSpecsId: device.techSpecsId,
        description: device.description,
      },
    });

    await prisma.specItem.deleteMany({ where: { category: { deviceId: deviceRecord.id } } });
    await prisma.specCategory.deleteMany({ where: { deviceId: deviceRecord.id } });

    for (const category of device.categories) {
      await prisma.specCategory.create({
        data: {
          name: category.name,
          slug: category.slug,
          summary: category.summary,
          orbitRadius: category.orbitHint?.radius ?? null,
          orbitSpeed: category.orbitHint?.speed ?? null,
          orbitPhase: category.orbitHint?.phase ?? null,
          deviceId: deviceRecord.id,
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

  await prisma.userFavoriteDevice.upsert({
    where: {
      userId_deviceId: {
        userId: demoUser.id,
        deviceId: devices[0].id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      deviceId: devices[0].id,
      notes: "Pinned starter device",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
