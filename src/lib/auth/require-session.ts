import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { User, UserRole } from "@/types";

export async function requireSession(allowedRoles?: UserRole[]): Promise<
  | { user: User; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getSession();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
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
