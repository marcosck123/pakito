"use server";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { User } from "@/types";
import { mockUsers, mockCredentials } from "@/lib/mock-data/users";

const SESSION_COOKIE = "cotacoes_session";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn("[session] SESSION_SECRET não configurado — usando chave padrão. Configure a variável de ambiente em produção.");
    return "pakito-dev-secret-configure-SESSION_SECRET-in-production";
  }
  return secret;
}

function sign(userId: string): string {
  const secret = getSecret();
  const mac = createHmac("sha256", secret).update(userId).digest("hex");
  return `${userId}.${mac}`;
}

function verify(value: string): string | null {
  try {
    const lastDot = value.lastIndexOf(".");
    if (lastDot === -1) return null;
    const userId = value.slice(0, lastDot);
    const mac = value.slice(lastDot + 1);
    const expected = createHmac("sha256", getSecret()).update(userId).digest("hex");
    const macBuf = Buffer.from(mac, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (macBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(macBuf, expectedBuf)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function login(email: string, senha: string): Promise<User | null> {
  const hash = mockCredentials[email];
  if (!hash) return null;
  const valid = await bcrypt.compare(senha, hash);
  if (!valid) return null;
  const user = mockUsers.find((u) => u.email === email && u.ativo);
  if (!user) return null;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sign(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  let userId: string | null;
  try {
    userId = verify(raw);
  } catch {
    return null;
  }
  if (!userId) return null;
  return mockUsers.find((u) => u.id === userId) ?? null;
}
