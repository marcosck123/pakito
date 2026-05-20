import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 400 });
  }

  const user = await login(parsed.data.email, parsed.data.senha);
  if (!user) {
    return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
