import { ApprovalRequisitionsClient } from "@/components/aprovacao/approval-requisitions-client";
import { getSession } from "@/lib/auth/session";
import { canDo } from "@/lib/security/permissions";

export default async function AprovacaoPage() {
  const user = await getSession();
  if (!user) return null;

  const perms = canDo(user.role);

  return <ApprovalRequisitionsClient canApprove={perms.aprovarRequisicao} />;
}
