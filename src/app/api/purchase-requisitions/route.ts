import { NextResponse } from "next/server";
import { upsert } from "@/lib/mock-data/purchase-requisitions";

export async function POST(request: Request) {
  const body = await request.json();
  const result = upsert(body);
  return NextResponse.json(result);
}
