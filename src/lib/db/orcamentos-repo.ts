import { db } from "./firebase-admin";
import type { Orcamento, OrcamentoStatus } from "@/types";

const COL = "orcamentos";

export async function getOrcamentos(): Promise<Orcamento[]> {
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => d.data() as Orcamento);
}

export async function getOrcamento(id: string): Promise<Orcamento | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Orcamento;
}

export async function getOrcamentosByCotacao(cotacaoId: string): Promise<Orcamento[]> {
  const snap = await db.collection(COL).where("cotacaoId", "==", cotacaoId).get();
  return snap.docs.map((d) => d.data() as Orcamento);
}

export async function createOrcamento(
  data: Omit<Orcamento, "id" | "criadoEm">
): Promise<Orcamento> {
  const ref = db.collection(COL).doc();
  const now = new Date().toISOString();
  const orcamento: Orcamento = {
    ...data,
    id: ref.id,
    criadoEm: now,
  };
  await ref.set(orcamento);
  return orcamento;
}

export async function updateOrcamento(
  id: string,
  data: Partial<Omit<Orcamento, "id" | "criadoEm">>
): Promise<Orcamento | null> {
  const ref = db.collection(COL).doc(id);
  await ref.update(data as FirebaseFirestore.UpdateData<Orcamento>);
  const updated = await ref.get();
  if (!updated.exists) return null;
  return updated.data() as Orcamento;
}

export async function updateOrcamentoStatus(
  id: string,
  status: OrcamentoStatus
): Promise<Orcamento | null> {
  return updateOrcamento(id, { status });
}
