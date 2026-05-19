import { NextResponse } from "next/server";
import { upsert } from "@/lib/mock-data/purchase-requisitions";
import { requireSession } from "@/lib/auth/require-session";

export async function POST(request: Request) {
  const { error } = await requireSession(["ADMIN", "COMPRAS", "SOLICITANTE"]);
  if (error) return error;

  const body = await request.json();
  const result = upsert(body);
  return NextResponse.json(result);
}
