import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { db } from "@/lib/db/firebase-admin";

export const runtime = "nodejs";

const COLLECTIONS = [
  "fornecedores",
  "pecas",
  "cotacoes",
  "orcamentos",
  "requisicoes",
  "purchase_requisitions",
  "audit_logs",
] as const;

async function readCollection(name: string): Promise<Record<string, unknown>[]> {
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => d.data() as Record<string, unknown>);
}

export async function GET() {
  const { error } = await requireSession(["ADMIN"]);
  if (error) return error;

  try {
    const entries = await Promise.all(
      COLLECTIONS.map(async (col) => [col, await readCollection(col)] as const)
    );

    const backup: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      ...Object.fromEntries(entries),
    };

    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=backup-${today}.json`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao exportar backup." },
      { status: 500 }
    );
  }
}
