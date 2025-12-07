import { requireUser } from "@/lib/auth";
import { getCsvSummaryById, getDeviceFromCsv } from "@/features/device/services/deviceCsvSource";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.userFavoriteDevice.findMany({
    where: { userId: user.id },
    include: { device: true },
  });

  const summaries = await Promise.all(favorites.map((fav) => getCsvSummaryById(fav.deviceId)));

  return NextResponse.json(
    favorites.map((fav, idx) => ({
      id: fav.device.id,
      name: summaries[idx]?.name ?? fav.device.name,
      brand: summaries[idx]?.brand ?? fav.device.brand ?? undefined,
      techSpecsId: undefined,
      sketchfabUid: fav.device.sketchfabUid ?? undefined,
      createdAt: fav.createdAt,
    })),
  );
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const deviceId: string = body?.deviceId;
  if (!deviceId) return NextResponse.json({ message: "deviceId required" }, { status: 400 });

  const csvDevice = await getDeviceFromCsv(deviceId);
  if (!csvDevice) return NextResponse.json({ message: "Device not found in devices.csv" }, { status: 404 });

  await prisma.device.upsert({
    where: { id: deviceId },
    update: {
      name: csvDevice.name,
      brand: csvDevice.brand ?? null,
      description: csvDevice.description ?? null,
      sketchfabUid: csvDevice.sketchfabUid ?? null,
      priceUSD: csvDevice.priceUSD ?? null,
    },
    create: {
      id: deviceId,
      name: csvDevice.name,
      brand: csvDevice.brand ?? null,
      description: csvDevice.description ?? null,
      sketchfabUid: csvDevice.sketchfabUid ?? null,
      priceUSD: csvDevice.priceUSD ?? null,
    },
  });

  await prisma.userFavoriteDevice.upsert({
    where: {
      userId_deviceId: {
        userId: user.id,
        deviceId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      deviceId,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const deviceId: string = body?.deviceId;
  if (!deviceId) return NextResponse.json({ message: "deviceId required" }, { status: 400 });

  await prisma.userFavoriteDevice.deleteMany({
    where: { userId: user.id, deviceId },
  });

  return NextResponse.json({ ok: true });
}
