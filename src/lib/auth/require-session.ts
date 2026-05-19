import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { User, UserRole } from "@/types";
import { mockUsers } from "@/lib/mock-data/users";

const SESSION_COOKIE = "cotacoes_session";

export async function requireSession(allowedRoles?: UserRole[]): Promise<
  | { user: User; error: null }
  | { user: null; error: NextResponse }
> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) {
    return {
      user: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const user = mockUsers.find((u) => u.id === userId && u.ativo);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Sessão inválida" }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Sem permissão" }, { status: 403 }),
    };
  }

  return { user, error: null };
}
