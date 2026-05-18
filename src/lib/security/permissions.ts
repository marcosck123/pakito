import type { UserRole } from "@/types";

type Permission =
  | "ver_dashboard"
  | "cadastrar_fornecedor"
  | "editar_fornecedor"
  | "cadastrar_peca"
  | "criar_cotacao"
  | "adicionar_fornecedor_cotacao"
  | "adicionar_orcamento"
  | "anexar_orcamento"
  | "comparar_orcamento"
  | "gerar_requisicao"
  | "aprovar_requisicao"
  | "reprovar_requisicao"
  | "solicitar_ajuste"
  | "fechar_pedido"
  | "marcar_peca_recebida"
  | "cancelar_requisicao"
  | "ver_relatorios";

const permissionsMap: Record<Permission, UserRole[]> = {
  ver_dashboard: ["ADMIN", "COMPRAS", "SOLICITANTE", "APROVADOR", "RECEBIMENTO", "VISUALIZADOR"],
  cadastrar_fornecedor: ["ADMIN", "COMPRAS"],
  editar_fornecedor: ["ADMIN", "COMPRAS"],
  cadastrar_peca: ["ADMIN", "COMPRAS", "SOLICITANTE"],
  criar_cotacao: ["ADMIN", "COMPRAS", "SOLICITANTE"],
  adicionar_fornecedor_cotacao: ["ADMIN", "COMPRAS"],
  adicionar_orcamento: ["ADMIN", "COMPRAS"],
  anexar_orcamento: ["ADMIN", "COMPRAS"],
  comparar_orcamento: ["ADMIN", "COMPRAS", "SOLICITANTE", "APROVADOR", "VISUALIZADOR"],
  gerar_requisicao: ["ADMIN", "COMPRAS", "SOLICITANTE"],
  aprovar_requisicao: ["ADMIN", "APROVADOR"],
  reprovar_requisicao: ["ADMIN", "APROVADOR"],
  solicitar_ajuste: ["ADMIN", "APROVADOR"],
  fechar_pedido: ["ADMIN", "COMPRAS"],
  marcar_peca_recebida: ["ADMIN", "COMPRAS", "RECEBIMENTO"],
  cancelar_requisicao: ["ADMIN", "COMPRAS", "APROVADOR"],
  ver_relatorios: ["ADMIN", "COMPRAS", "APROVADOR", "VISUALIZADOR"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsMap[permission]?.includes(role) ?? false;
}

export function canDo(role: UserRole) {
  return {
    cadastrarFornecedor: hasPermission(role, "cadastrar_fornecedor"),
    editarFornecedor: hasPermission(role, "editar_fornecedor"),
    cadastrarPeca: hasPermission(role, "cadastrar_peca"),
    criarCotacao: hasPermission(role, "criar_cotacao"),
    adicionarFornecedorCotacao: hasPermission(role, "adicionar_fornecedor_cotacao"),
    adicionarOrcamento: hasPermission(role, "adicionar_orcamento"),
    anexarOrcamento: hasPermission(role, "anexar_orcamento"),
    compararOrcamento: hasPermission(role, "comparar_orcamento"),
    gerarRequisicao: hasPermission(role, "gerar_requisicao"),
    aprovarRequisicao: hasPermission(role, "aprovar_requisicao"),
    reprovarRequisicao: hasPermission(role, "reprovar_requisicao"),
    solicitarAjuste: hasPermission(role, "solicitar_ajuste"),
    fecharPedido: hasPermission(role, "fechar_pedido"),
    marcarPecaRecebida: hasPermission(role, "marcar_peca_recebida"),
    cancelarRequisicao: hasPermission(role, "cancelar_requisicao"),
    verRelatorios: hasPermission(role, "ver_relatorios"),
  };
}
