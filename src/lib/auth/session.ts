"use server";

import { cookies } from "next/headers";
import type { User } from "@/types";
import { mockUsers, mockCredentials } from "@/lib/mock-data/users";

const SESSION_COOKIE = "cotacoes_session";

export async function login(email: string, senha: string): Promise<User | null> {
  const expectedSenha = mockCredentials[email];
  if (!expectedSenha || expectedSenha !== senha) return null;
  const user = mockUsers.find((u) => u.email === email && u.ativo);
  if (!user) return null;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  });
  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return mockUsers.find((u) => u.id === userId) ?? null;
}
