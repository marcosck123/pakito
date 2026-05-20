import { db } from "./firebase-admin";
import type { Requisicao, RequisicaoStatus, HistoricoRequisicao } from "@/types";

const COL = "requisicoes";
const COUNTER_DOC = "_counters/requisicoes";

async function nextNumero(): Promise<string> {
  const counterRef = db.doc(COUNTER_DOC);
  let next = 1;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    next = snap.exists ? (snap.data()?.next ?? 1) : 1;
    tx.set(counterRef, { next: next + 1 }, { merge: true });
  });
  return `REQ-${String(next).padStart(5, "0")}`;
}

export async function getRequisicoes(): Promise<Requisicao[]> {
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => d.data() as Requisicao);
}

export async function getRequisicao(id: string): Promise<Requisicao | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Requisicao;
}

export async function createRequisicao(
  data: Omit<Requisicao, "id" | "numero" | "criadoEm" | "atualizadoEm">
): Promise<Requisicao> {
  const ref = db.collection(COL).doc();
  const now = new Date().toISOString();
  const numero = await nextNumero();
  const requisicao: Requisicao = {
    ...data,
    id: ref.id,
    numero,
    criadoEm: now,
    atualizadoEm: now,
  };
  await ref.set(requisicao);
  return requisicao;
}

export async function updateRequisicao(
  id: string,
  data: Partial<Omit<Requisicao, "id" | "numero" | "criadoEm">>
): Promise<Requisicao | null> {
  const ref = db.collection(COL).doc(id);
  const now = new Date().toISOString();
  await ref.update({ ...data, atualizadoEm: now } as FirebaseFirestore.UpdateData<Requisicao>);
  const updated = await ref.get();
  if (!updated.exists) return null;
  return updated.data() as Requisicao;
}

export async function updateRequisicaoStatus(
  id: string,
  status: RequisicaoStatus,
  usuarioId: string,
  comentario?: string
): Promise<Requisicao | null> {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const current = snap.data() as Requisicao;

  const historicoEntry: HistoricoRequisicao = {
    id: db.collection(COL).doc().id,
    data: new Date().toISOString(),
    acao: `Status alterado para ${status}`,
    usuarioId,
    comentario,
    statusAnterior: current.status,
    statusNovo: status,
  };

  const now = new Date().toISOString();
  await ref.update({
    status,
    atualizadoEm: now,
    historico: [...(current.historico ?? []), historicoEntry],
  });

  const updated = await ref.get();
  return updated.data() as Requisicao;
}
