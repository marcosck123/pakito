export type ApprovalStatus =
  | "AGUARDANDO_APROVACAO"
  | "APROVADA"
  | "REPROVADA"
  | "AJUSTE_SOLICITADO"
  | "PEDIDO_FECHADO"
  | "CANCELADA";

export type ApprovalDecisionAction = "APROVAR" | "REPROVAR" | "SOLICITAR_AJUSTE";

export type ApprovalUrgency = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";

export interface ApprovalRequisitionItem {
  id: string;
  partName: string;
  brand: string | null;
  supplierName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface ApprovalDecision {
  id: string;
  requisitionId: string;
  action: ApprovalDecisionAction;
  comment: string | null;
  decidedBy: string;
  decidedAt: string;
}

export interface ApprovalRequisition {
  id: string;
  code: string;
  requesterName: string;
  department: string;
  urgency: ApprovalUrgency;
  status: ApprovalStatus;
  justification: string | null;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  items: ApprovalRequisitionItem[];
  lastDecision: ApprovalDecision | null;
}

export interface ApprovalRequisitionsPayload {
  pending: ApprovalRequisition[];
  history: ApprovalRequisition[];
}
