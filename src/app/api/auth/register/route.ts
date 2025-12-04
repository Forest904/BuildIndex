import { createSession, hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function validate(email: string, password: string) {
  return email.includes("@") && password.length >= 8;
}

export async function POST(request: Request) {
  const body = await request.json();
  const email: string = body?.email?.toLowerCase()?.trim();
  const username: string | undefined = body?.username?.trim();
  const password: string = body?.password ?? "";

  if (!email || !password || !validate(email, password)) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
  });

  await createSession(user.id);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  });
}
