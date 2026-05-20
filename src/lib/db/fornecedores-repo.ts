import { db } from "./firebase-admin";
import type { Fornecedor } from "@/types";

const COL = "fornecedores";

export async function getFornecedores(): Promise<Fornecedor[]> {
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => d.data() as Fornecedor);
}

export async function getFornecedor(id: string): Promise<Fornecedor | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Fornecedor;
}

export async function createFornecedor(
  data: Omit<Fornecedor, "id" | "criadoEm" | "atualizadoEm">
): Promise<Fornecedor> {
  const ref = db.collection(COL).doc();
  const now = new Date().toISOString();
  const fornecedor: Fornecedor = {
    ...data,
    id: ref.id,
    criadoEm: now,
    atualizadoEm: now,
  };
  await ref.set(fornecedor);
  return fornecedor;
}

export async function updateFornecedor(
  id: string,
  data: Partial<Omit<Fornecedor, "id" | "criadoEm">>
): Promise<Fornecedor | null> {
  const ref = db.collection(COL).doc(id);
  const now = new Date().toISOString();
  await ref.update({ ...data, atualizadoEm: now });
  const updated = await ref.get();
  if (!updated.exists) return null;
  return updated.data() as Fornecedor;
}

export async function deleteFornecedor(id: string): Promise<void> {
  await db.collection(COL).doc(id).delete();
}
