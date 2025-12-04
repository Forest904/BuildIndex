import { Device } from "@/domain/models";
import { mockDevices } from "@/features/device/data/mockDevices";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type DeviceWithSpecs = Prisma.DeviceGetPayload<{
  include: {
    categories: {
      include: {
        specs: true;
      };
    };
  };
}>;

function mapDevice(record: DeviceWithSpecs): Device {
  return {
    id: record.id,
    name: record.name,
    brand: record.brand ?? undefined,
    modelNumber: record.modelNumber ?? undefined,
    releaseDate: record.releaseDate ? record.releaseDate.toISOString() : undefined,
    priceUSD: record.priceUSD ?? undefined,
    imageUrl: record.imageUrl ?? undefined,
    modelUrl: record.modelUrl ?? undefined,
    sketchfabUid: record.sketchfabUid ?? undefined,
    techSpecsId: record.techSpecsId ?? undefined,
    description: record.description ?? undefined,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
    categories: (record.categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      summary: category.summary ?? undefined,
      orbitHint: {
        radius: category.orbitRadius ?? 180,
        speed: category.orbitSpeed ?? 0.8,
        phase: category.orbitPhase ?? 0,
      },
      specs: (category.specs ?? []).map((spec) => ({
        key: spec.key,
        label: spec.label,
        value: spec.value,
        unit: spec.unit ?? undefined,
        importance: spec.importance ?? undefined,
      })),
    })),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ message: "Device id is required" }, { status: 400 });
  }

  try {
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        categories: { include: { specs: true } },
      },
    });

    if (device) {
      return NextResponse.json(mapDevice(device));
    }
  } catch (error) {
    console.error(`/api/devices/${id} db error`, error);
  }

  const fallback = mockDevices.find((device) => device.id === id);
  if (fallback) {
    return NextResponse.json(fallback);
  }

  return NextResponse.json({ message: "Device not found" }, { status: 404 });
}
