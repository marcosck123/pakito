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

async function findUserById(id: string): Promise<User | null> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return mockUsers.find((u) => u.id === id) ?? null;
  }
  const { getUser } = await import("@/lib/db/users-repo");
  return getUser(id);
}

async function findUserByEmail(email: string): Promise<{ user: User; passwordHash: string } | null> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    const hash = mockCredentials[email];
    const user = mockUsers.find((u) => u.email === email);
    if (!hash || !user) return null;
    return { user, passwordHash: hash };
  }
  const { getUserByEmail } = await import("@/lib/db/users-repo");
  return getUserByEmail(email);
}

export async function login(email: string, senha: string): Promise<User | null> {
  const result = await findUserByEmail(email);
  if (!result) return null;
  const { user, passwordHash } = result;
  const valid = await bcrypt.compare(senha, passwordHash);
  if (!valid) return null;
  if (!user.ativo) return null;
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
  return findUserById(userId);
}
