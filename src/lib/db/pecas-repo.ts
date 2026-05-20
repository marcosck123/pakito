import { db } from "./firebase-admin";
import type { Peca } from "@/types";

const COL = "pecas";

export async function getPecas(): Promise<Peca[]> {
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => d.data() as Peca);
}

export async function getPeca(id: string): Promise<Peca | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Peca;
}

export async function createPeca(
  data: Omit<Peca, "id" | "criadoEm">
): Promise<Peca> {
  const ref = db.collection(COL).doc();
  const now = new Date().toISOString();
  const peca: Peca = {
    ...data,
    id: ref.id,
    criadoEm: now,
  };
  await ref.set(peca);
  return peca;
}

export async function updatePeca(
  id: string,
  data: Partial<Omit<Peca, "id" | "criadoEm">>
): Promise<Peca | null> {
  const ref = db.collection(COL).doc(id);
  await ref.update(data as FirebaseFirestore.UpdateData<Peca>);
  const updated = await ref.get();
  if (!updated.exists) return null;
  return updated.data() as Peca;
}
