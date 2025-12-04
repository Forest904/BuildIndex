import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.userFavoriteDevice.findMany({
    where: { userId: user.id },
    include: { device: true },
  });

  return NextResponse.json(
    favorites.map((fav) => ({
      id: fav.device.id,
      name: fav.device.name,
      brand: fav.device.brand ?? undefined,
      techSpecsId: fav.device.techSpecsId ?? undefined,
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
