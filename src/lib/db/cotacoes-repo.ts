import { db } from "./firebase-admin";
import type { Cotacao, CotacaoStatus } from "@/types";

const COL = "cotacoes";
const COUNTER_DOC = "_counters/cotacoes";

async function nextCodigo(): Promise<string> {
  const counterRef = db.doc(COUNTER_DOC);
  let next = 1;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    next = snap.exists ? (snap.data()?.next ?? 1) : 1;
    tx.set(counterRef, { next: next + 1 }, { merge: true });
  });
  return `COT-${String(next).padStart(5, "0")}`;
}

export async function getCotacoes(): Promise<Cotacao[]> {
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => d.data() as Cotacao);
}

export async function getCotacao(id: string): Promise<Cotacao | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Cotacao;
}

export async function createCotacao(
  data: Omit<Cotacao, "id" | "codigo" | "criadoEm" | "atualizadoEm">
): Promise<Cotacao> {
  const ref = db.collection(COL).doc();
  const now = new Date().toISOString();
  const codigo = await nextCodigo();
  const cotacao: Cotacao = {
    ...data,
    id: ref.id,
    codigo,
    criadoEm: now,
    atualizadoEm: now,
  };
  await ref.set(cotacao);
  return cotacao;
}

export async function updateCotacao(
  id: string,
  data: Partial<Omit<Cotacao, "id" | "codigo" | "criadoEm">>
): Promise<Cotacao | null> {
  const ref = db.collection(COL).doc(id);
  const now = new Date().toISOString();
  await ref.update({ ...data, atualizadoEm: now } as FirebaseFirestore.UpdateData<Cotacao>);
  const updated = await ref.get();
  if (!updated.exists) return null;
  return updated.data() as Cotacao;
}

export async function updateCotacaoStatus(
  id: string,
  status: CotacaoStatus
): Promise<Cotacao | null> {
  return updateCotacao(id, { status });
}
