import { mockDevices } from "@/features/device/data/mockDevices";
import { getDeviceFromCsv } from "@/features/device/services/deviceCsvSource";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Device id is required" }, { status: 400 });
  }

  try {
    const csvDevice = await getDeviceFromCsv(id);
    if (csvDevice) {
      return NextResponse.json(csvDevice);
    }
  } catch (error) {
    console.error(`/api/devices/${id} csv read error`, error);
  }

  const fallback = mockDevices.find((device) => device.id === id);
  if (fallback) {
    return NextResponse.json(fallback);
  }

  return NextResponse.json({ message: "Device not found" }, { status: 404 });
}
