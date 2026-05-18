import {
  supabaseRest,
  supabaseRpc,
} from "@/lib/db/supabase-rest";
import type {
  ApprovalDecision,
  ApprovalDecisionAction,
  ApprovalRequisition,
  ApprovalRequisitionItem,
  ApprovalRequisitionsPayload,
  ApprovalStatus,
  ApprovalUrgency,
} from "./types";

type DbPurchaseRequisitionItem = {
  id: string;
  requisition_id: string;
  part_name: string;
  brand: string | null;
  supplier_name: string | null;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
  created_at: string;
};

type DbPurchaseRequisitionDecision = {
  id: string;
  requisition_id: string;
  action: ApprovalDecisionAction;
  comment: string | null;
  decided_by: string;
  decided_at: string;
};

type DbPurchaseRequisition = {
  id: string;
  code: string;
  requester_name: string;
  department: string;
  urgency: ApprovalUrgency;
  status: ApprovalStatus;
  justification: string | null;
  total_value: number | string;
  created_at: string;
  updated_at: string;
  purchase_requisition_items?: DbPurchaseRequisitionItem[] | null;
};

type DecisionRpcResponse = {
  decision?: DbPurchaseRequisitionDecision;
};

const REQUISITION_SELECT = [
  "id",
  "code",
  "requester_name",
  "department",
  "urgency",
  "status",
  "justification",
  "total_value",
  "created_at",
  "updated_at",
  "purchase_requisition_items(id,requisition_id,part_name,brand,supplier_name,quantity,unit_price,total_price,created_at)",
].join(",");

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapItem(row: DbPurchaseRequisitionItem): ApprovalRequisitionItem {
  return {
    id: row.id,
    partName: row.part_name,
    brand: row.brand,
    supplierName: row.supplier_name,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    totalPrice: toNumber(row.total_price),
    createdAt: row.created_at,
  };
}

function mapDecision(row: DbPurchaseRequisitionDecision): ApprovalDecision {
  return {
    id: row.id,
    requisitionId: row.requisition_id,
    action: row.action,
    comment: row.comment,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
  };
}

function mapRequisition(
  row: DbPurchaseRequisition,
  lastDecision: ApprovalDecision | null
): ApprovalRequisition {
  return {
    id: row.id,
    code: row.code,
    requesterName: row.requester_name,
    department: row.department,
    urgency: row.urgency,
    status: row.status,
    justification: row.justification,
    totalValue: toNumber(row.total_value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.purchase_requisition_items ?? []).map(mapItem),
    lastDecision,
  };
}

async function fetchRequisitions(statuses: ApprovalStatus[]) {
  const params = new URLSearchParams({
    select: REQUISITION_SELECT,
    status: `in.(${statuses.join(",")})`,
    order: "created_at.desc",
  });

  return supabaseRest<DbPurchaseRequisition[]>(
    `purchase_requisitions?${params.toString()}`
  );
}

async function fetchRequisitionById(id: string) {
  const params = new URLSearchParams({
    select: REQUISITION_SELECT,
    id: `eq.${id}`,
    limit: "1",
  });

  const rows = await supabaseRest<DbPurchaseRequisition[]>(
    `purchase_requisitions?${params.toString()}`
  );

  return rows[0] ?? null;
}

async function fetchDecisions(requisitionIds: string[]) {
  if (requisitionIds.length === 0) return [];

  const params = new URLSearchParams({
    select: "id,requisition_id,action,comment,decided_by,decided_at",
    requisition_id: `in.(${requisitionIds.join(",")})`,
    order: "decided_at.desc",
  });

  return supabaseRest<DbPurchaseRequisitionDecision[]>(
    `purchase_requisition_decisions?${params.toString()}`
  );
}

function indexLastDecisions(rows: DbPurchaseRequisitionDecision[]) {
  const indexed = new Map<string, ApprovalDecision>();

  for (const row of rows) {
    if (!indexed.has(row.requisition_id)) {
      indexed.set(row.requisition_id, mapDecision(row));
    }
  }

  return indexed;
}

export async function listApprovalRequisitions(): Promise<ApprovalRequisitionsPayload> {
  const rows = await fetchRequisitions([
    "AGUARDANDO_APROVACAO",
    "APROVADA",
    "REPROVADA",
    "AJUSTE_SOLICITADO",
  ]);
  const lastDecisions = indexLastDecisions(await fetchDecisions(rows.map((row) => row.id)));
  const requisitions = rows.map((row) =>
    mapRequisition(row, lastDecisions.get(row.id) ?? null)
  );

  return {
    pending: requisitions.filter((row) => row.status === "AGUARDANDO_APROVACAO"),
    history: requisitions.filter((row) => row.status !== "AGUARDANDO_APROVACAO"),
  };
}

export async function decidePurchaseRequisition(
  requisitionId: string,
  action: ApprovalDecisionAction,
  comment: string | null
) {
  const response = await supabaseRpc<DecisionRpcResponse>(
    "decide_purchase_requisition",
    {
      p_requisition_id: requisitionId,
      p_action: action,
      p_comment: comment,
      p_decided_by: "Responsável",
    }
  );
  const row = await fetchRequisitionById(requisitionId);

  if (!row) {
    throw new Error("Requisicao nao encontrada apos salvar a decisao.");
  }

  return mapRequisition(row, response.decision ? mapDecision(response.decision) : null);
}
