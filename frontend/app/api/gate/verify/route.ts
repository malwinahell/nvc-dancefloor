import { NextRequest, NextResponse } from "next/server";

const GATE_COOKIE_NAME = "nvc_gate";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dni

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({ password: "" }));
  const password = typeof body.password === "string" ? body.password : "";

  const expectedPassword = process.env.GATE_PASSWORD;
  const gateToken = process.env.GATE_TOKEN;

  if (!expectedPassword || !gateToken) {
    console.error("GATE_PASSWORD / GATE_TOKEN nie są ustawione w env.");
    return NextResponse.json(
      { error: "Bramka nie jest skonfigurowana." },
      { status: 500 },
    );
  }

  if (password !== expectedPassword) {
    return NextResponse.json(
      { error: "Nieprawidłowe hasło." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE_NAME, gateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_SECONDS,
    path: "/",
  });
  return response;
}
