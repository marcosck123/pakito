import { db } from "./firebase-admin";

export type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE"
  | "APPROVE" | "REJECT" | "LOGIN" | "EXPORT";

export interface AuditLog {
  id: string;
  entidade: string; // "cotacao" | "orcamento" | "requisicao" | "fornecedor" | "peca" | "usuario"
  entidadeId: string;
  acao: AuditAction;
  usuarioId: string;
  usuarioNome?: string;
  detalhes?: Record<string, unknown>;
  ip?: string;
  criadoEm: string;
}

export async function logAudit(
  entidade: string,
  entidadeId: string,
  acao: AuditAction,
  usuarioId: string,
  detalhes?: Record<string, unknown>
): Promise<void> {
  try {
    const ref = db.collection("audit_logs").doc();
    const log: AuditLog = {
      id: ref.id,
      entidade,
      entidadeId,
      acao,
      usuarioId,
      detalhes,
      criadoEm: new Date().toISOString(),
    };
    await ref.set(log);
  } catch (err) {
    console.error("[audit] Failed to write audit log", err);
  }
}

export async function getAuditLogs(
  filters?: { entidade?: string; entidadeId?: string; usuarioId?: string; limit?: number }
): Promise<AuditLog[]> {
  let q = db.collection("audit_logs").orderBy("criadoEm", "desc") as FirebaseFirestore.Query;
  if (filters?.entidade) q = q.where("entidade", "==", filters.entidade);
  if (filters?.entidadeId) q = q.where("entidadeId", "==", filters.entidadeId);
  if (filters?.usuarioId) q = q.where("usuarioId", "==", filters.usuarioId);
  q = q.limit(filters?.limit ?? 200);
  const snap = await q.get();
  return snap.docs.map((d) => d.data() as AuditLog);
}
