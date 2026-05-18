import type {
  CotacaoStatus,
  OrcamentoStatus,
  RequisicaoStatus,
  FornecedorStatus,
  FornecedorCotacaoStatus,
  Urgencia,
  ItemEntregaStatus,
  PecaStatus,
} from "@/types";

export const cotacaoStatusLabel: Record<CotacaoStatus, string> = {
  RASCUNHO: "Rascunho",
  MENSAGEM_GERADA: "Mensagem gerada",
  ENVIADA_AOS_FORNECEDORES: "Enviada",
  AGUARDANDO_RESPOSTAS: "Aguardando respostas",
  ORCAMENTOS_RECEBIDOS: "Orçamentos recebidos",
  EM_ANALISE: "Em análise",
  REQUISICAO_GERADA: "Requisição gerada",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export const cotacaoStatusColor: Record<CotacaoStatus, string> = {
  RASCUNHO: "bg-gray-100 text-gray-700",
  MENSAGEM_GERADA: "bg-blue-100 text-blue-700",
  ENVIADA_AOS_FORNECEDORES: "bg-blue-100 text-blue-800",
  AGUARDANDO_RESPOSTAS: "bg-yellow-100 text-yellow-800",
  ORCAMENTOS_RECEBIDOS: "bg-purple-100 text-purple-800",
  EM_ANALISE: "bg-orange-100 text-orange-800",
  REQUISICAO_GERADA: "bg-green-100 text-green-800",
  FINALIZADA: "bg-emerald-100 text-emerald-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export const requisicaoStatusLabel: Record<RequisicaoStatus, string> = {
  RASCUNHO: "Rascunho",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  SOLICITAR_AJUSTE: "Aguardando ajuste",
  PEDIDO_FECHADO: "Pedido fechado",
  AGUARDANDO_ENTREGA: "Aguardando entrega",
  PARCIALMENTE_RECEBIDA: "Parcialmente recebida",
  RECEBIDA: "Recebida",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export const requisicaoStatusColor: Record<RequisicaoStatus, string> = {
  RASCUNHO: "bg-gray-100 text-gray-700",
  AGUARDANDO_APROVACAO: "bg-yellow-100 text-yellow-800",
  APROVADA: "bg-green-100 text-green-800",
  REPROVADA: "bg-red-100 text-red-800",
  SOLICITAR_AJUSTE: "bg-orange-100 text-orange-800",
  PEDIDO_FECHADO: "bg-blue-100 text-blue-800",
  AGUARDANDO_ENTREGA: "bg-purple-100 text-purple-800",
  PARCIALMENTE_RECEBIDA: "bg-yellow-100 text-yellow-800",
  RECEBIDA: "bg-teal-100 text-teal-800",
  FINALIZADA: "bg-emerald-100 text-emerald-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export const orcamentoStatusLabel: Record<OrcamentoStatus, string> = {
  RECEBIDO: "Recebido",
  PENDENTE_CONFERENCIA: "Pendente conferência",
  CONFERIDO: "Conferido",
  INVALIDO: "Inválido",
  VENCIDO: "Vencido",
  SELECIONADO: "Selecionado",
  RECUSADO: "Recusado",
};

export const orcamentoStatusColor: Record<OrcamentoStatus, string> = {
  RECEBIDO: "bg-blue-100 text-blue-700",
  PENDENTE_CONFERENCIA: "bg-yellow-100 text-yellow-800",
  CONFERIDO: "bg-green-100 text-green-800",
  INVALIDO: "bg-red-100 text-red-800",
  VENCIDO: "bg-gray-100 text-gray-700",
  SELECIONADO: "bg-emerald-100 text-emerald-800",
  RECUSADO: "bg-red-100 text-red-800",
};

export const fornecedorStatusLabel: Record<FornecedorStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  BLOQUEADO: "Bloqueado",
};

export const fornecedorStatusColor: Record<FornecedorStatus, string> = {
  ATIVO: "bg-green-100 text-green-800",
  INATIVO: "bg-gray-100 text-gray-700",
  BLOQUEADO: "bg-red-100 text-red-800",
};

export const fornecedorCotacaoStatusLabel: Record<FornecedorCotacaoStatus, string> = {
  PENDENTE_ENVIO: "Pendente envio",
  MENSAGEM_ENVIADA: "Mensagem enviada",
  AGUARDANDO_RESPOSTA: "Aguardando resposta",
  RESPONDEU: "Respondeu",
  NAO_RESPONDEU: "Não respondeu",
  RECUSOU: "Recusou",
  ORCAMENTO_CADASTRADO: "Orçamento cadastrado",
};

export const fornecedorCotacaoStatusColor: Record<FornecedorCotacaoStatus, string> = {
  PENDENTE_ENVIO: "bg-gray-100 text-gray-700",
  MENSAGEM_ENVIADA: "bg-blue-100 text-blue-700",
  AGUARDANDO_RESPOSTA: "bg-yellow-100 text-yellow-800",
  RESPONDEU: "bg-teal-100 text-teal-800",
  NAO_RESPONDEU: "bg-red-100 text-red-800",
  RECUSOU: "bg-red-100 text-red-800",
  ORCAMENTO_CADASTRADO: "bg-green-100 text-green-800",
};

export const urgenciaLabel: Record<Urgencia, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const urgenciaColor: Record<Urgencia, string> = {
  BAIXA: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-800",
  URGENTE: "bg-red-100 text-red-800",
};

export const itemEntregaStatusLabel: Record<ItemEntregaStatus, string> = {
  AGUARDANDO_COMPRA: "Aguardando compra",
  COMPRADA: "Comprada",
  AGUARDANDO_ENTREGA: "Aguardando entrega",
  RECEBIDA_PARCIALMENTE: "Parcialmente recebida",
  RECEBIDA: "Recebida",
  COM_PROBLEMA: "Com problema",
  DEVOLVIDA: "Devolvida",
  CANCELADA: "Cancelada",
};

export const itemEntregaStatusColor: Record<ItemEntregaStatus, string> = {
  AGUARDANDO_COMPRA: "bg-gray-100 text-gray-700",
  COMPRADA: "bg-blue-100 text-blue-700",
  AGUARDANDO_ENTREGA: "bg-yellow-100 text-yellow-800",
  RECEBIDA_PARCIALMENTE: "bg-orange-100 text-orange-800",
  RECEBIDA: "bg-green-100 text-green-800",
  COM_PROBLEMA: "bg-red-100 text-red-800",
  DEVOLVIDA: "bg-purple-100 text-purple-800",
  CANCELADA: "bg-gray-100 text-gray-700",
};

export const pecaStatusLabel: Record<PecaStatus, string> = {
  ATIVA: "Ativa",
  INATIVA: "Inativa",
};

export const pecaStatusColor: Record<PecaStatus, string> = {
  ATIVA: "bg-green-100 text-green-800",
  INATIVA: "bg-gray-100 text-gray-700",
};