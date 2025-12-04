import { createSession, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const email: string = body?.email?.toLowerCase()?.trim();
  const password: string = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  });
}
