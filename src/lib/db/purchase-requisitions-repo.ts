import { db } from "./firebase-admin";
import type { PurchaseRequisition, PurchaseRequisitionStatus } from "@/types";

const COL = "purchase_requisitions";

export async function getPurchaseRequisitions(): Promise<PurchaseRequisition[]> {
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => d.data() as PurchaseRequisition);
}

export async function getPurchaseRequisition(id: string): Promise<PurchaseRequisition | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as PurchaseRequisition;
}

export async function upsertPurchaseRequisition(
  data: Omit<PurchaseRequisition, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }
): Promise<PurchaseRequisition> {
  const now = new Date().toISOString();

  if (data.id) {
    const ref = db.collection(COL).doc(data.id);
    const snap = await ref.get();
    if (snap.exists) {
      const updated: PurchaseRequisition = {
        ...(snap.data() as PurchaseRequisition),
        ...data,
        id: data.id,
        atualizadoEm: now,
      };
      await ref.set(updated);
      return updated;
    }
  }

  const ref = db.collection(COL).doc();
  const created: PurchaseRequisition = {
    ...data,
    id: ref.id,
    criadoEm: now,
    atualizadoEm: now,
  };
  await ref.set(created);
  return created;
}

export async function updatePurchaseRequisitionStatus(
  id: string,
  status: PurchaseRequisitionStatus
): Promise<PurchaseRequisition | null> {
  const ref = db.collection(COL).doc(id);
  const now = new Date().toISOString();
  await ref.update({ status, atualizadoEm: now });
  const updated = await ref.get();
  if (!updated.exists) return null;
  return updated.data() as PurchaseRequisition;
}
