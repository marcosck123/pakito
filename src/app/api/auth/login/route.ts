import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const { email, senha } = await request.json();
  const user = await login(email, senha);
  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
