import { db } from "./firebase-admin";
import type {
  ApprovalRequisition,
  ApprovalRequisitionItem,
  ApprovalDecision,
  ApprovalDecisionAction,
  ApprovalRequisitionsPayload,
  ApprovalStatus,
} from "@/lib/approval/types";

const REQUISITIONS_COL = "approval_requisitions";
const DECISIONS_COL = "approval_decisions";

async function loadItems(requisitionId: string): Promise<ApprovalRequisitionItem[]> {
  const snap = await db
    .collection(REQUISITIONS_COL)
    .doc(requisitionId)
    .collection("items")
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => d.data() as ApprovalRequisitionItem);
}

async function loadLastDecision(requisitionId: string): Promise<ApprovalDecision | null> {
  const snap = await db
    .collection(DECISIONS_COL)
    .where("requisitionId", "==", requisitionId)
    .orderBy("decidedAt", "desc")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data() as ApprovalDecision;
}

async function enrichRequisition(
  base: Omit<ApprovalRequisition, "items" | "lastDecision">
): Promise<ApprovalRequisition> {
  const [items, lastDecision] = await Promise.all([
    loadItems(base.id),
    loadLastDecision(base.id),
  ]);
  return { ...base, items, lastDecision };
}

export async function getApprovalRequisitions(): Promise<ApprovalRequisitionsPayload> {
  const snap = await db
    .collection(REQUISITIONS_COL)
    .orderBy("createdAt", "desc")
    .get();

  const bases = snap.docs.map(
    (d) => d.data() as Omit<ApprovalRequisition, "items" | "lastDecision">
  );

  const requisitions = await Promise.all(bases.map(enrichRequisition));

  return {
    pending: requisitions.filter((r) => r.status === "AGUARDANDO_APROVACAO"),
    history: requisitions.filter((r) => r.status !== "AGUARDANDO_APROVACAO"),
  };
}

export async function getApprovalRequisition(id: string): Promise<ApprovalRequisition | null> {
  const doc = await db.collection(REQUISITIONS_COL).doc(id).get();
  if (!doc.exists) return null;
  const base = doc.data() as Omit<ApprovalRequisition, "items" | "lastDecision">;
  return enrichRequisition(base);
}

export async function createApprovalRequisition(
  data: Omit<ApprovalRequisition, "id" | "items" | "lastDecision"> & {
    items: ApprovalRequisitionItem[];
  }
): Promise<ApprovalRequisition> {
  const ref = db.collection(REQUISITIONS_COL).doc();
  const { items, ...rest } = data;

  const base: Omit<ApprovalRequisition, "items" | "lastDecision"> = {
    ...rest,
    id: ref.id,
  };

  await ref.set(base);

  const batch = db.batch();
  for (const item of items) {
    const itemRef = ref.collection("items").doc(item.id || db.collection(REQUISITIONS_COL).doc().id);
    batch.set(itemRef, item);
  }
  await batch.commit();

  return { ...base, items, lastDecision: null };
}

export async function makeDecision(
  requisitionId: string,
  action: ApprovalDecisionAction,
  comment: string | null,
  decidedBy: string
): Promise<void> {
  const statusMap: Record<ApprovalDecisionAction, ApprovalStatus> = {
    APROVAR: "APROVADA",
    REPROVAR: "REPROVADA",
    SOLICITAR_AJUSTE: "AJUSTE_SOLICITADO",
  };

  const decisionRef = db.collection(DECISIONS_COL).doc();
  const decision: ApprovalDecision = {
    id: decisionRef.id,
    requisitionId,
    action,
    comment,
    decidedBy,
    decidedAt: new Date().toISOString(),
  };

  const requisitionRef = db.collection(REQUISITIONS_COL).doc(requisitionId);
  const newStatus = statusMap[action];

  await db.runTransaction(async (tx) => {
    tx.set(decisionRef, decision);
    tx.update(requisitionRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  });
}
