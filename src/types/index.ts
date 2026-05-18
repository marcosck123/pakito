// ===== AUTH / USER =====

export type UserRole =
  | "ADMIN"
  | "COMPRAS"
  | "SOLICITANTE"
  | "APROVADOR"
  | "RECEBIMENTO"
  | "VISUALIZADOR";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  setor: string;
  ativo: boolean;
}

// ===== FORNECEDOR =====

export type FornecedorStatus = "ATIVO" | "INATIVO" | "BLOQUEADO";

export interface Fornecedor {
  id: string;
  nome: string;
  nomeVendedor?: string;
  telefone: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  endereco?: string;
  cnpj?: string;
  categorias: string[];
  status: FornecedorStatus;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

// ===== PEÇA =====

export type UnidadeMedida =
  | "UNIDADE"
  | "PAR"
  | "JOGO"
  | "CAIXA"
  | "LITRO"
  | "METRO"
  | "KG";

export type PecaStatus = "ATIVA" | "INATIVA";

export interface Peca {
  id: string;
  nome: string;
  codigoInterno?: string;
  codigoOriginal?: string;
  categoria?: string;
  marcaPreferencial?: string;
  aplicacao?: string;
  descricao?: string;
  observacoes?: string;
  unidade: UnidadeMedida;
  status: PecaStatus;
  estoqueMinimo?: number;
  criadoEm: string;
}

// ===== COTAÇÃO =====

export type Urgencia = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";

export type CotacaoStatus =
  | "RASCUNHO"
  | "MENSAGEM_GERADA"
  | "ENVIADA_AOS_FORNECEDORES"
  | "AGUARDANDO_RESPOSTAS"
  | "ORCAMENTOS_RECEBIDOS"
  | "EM_ANALISE"
  | "REQUISICAO_GERADA"
  | "FINALIZADA"
  | "CANCELADA";

export interface CotacaoItem {
  id: string;
  pecaId: string;
  peca?: Peca;
  quantidade: number;
  marcaDesejada?: string;
  aceitaSimilar: boolean;
  observacao?: string;
}

export type FornecedorCotacaoStatus =
  | "PENDENTE_ENVIO"
  | "MENSAGEM_ENVIADA"
  | "AGUARDANDO_RESPOSTA"
  | "RESPONDEU"
  | "NAO_RESPONDEU"
  | "RECUSOU"
  | "ORCAMENTO_CADASTRADO";

export interface FornecedorCotacao {
  id: string;
  cotacaoId: string;
  fornecedorId: string;
  fornecedor?: Fornecedor;
  status: FornecedorCotacaoStatus;
  mensagemEnviadaEm?: string;
  respostaRecebidaEm?: string;
  observacao?: string;
}

export interface Cotacao {
  id: string;
  codigo: string;
  titulo: string;
  solicitanteId: string;
  solicitante?: User;
  setor: string;
  urgencia: Urgencia;
  dataLimiteResposta?: string;
  observacoes?: string;
  status: CotacaoStatus;
  itens: CotacaoItem[];
  fornecedores: FornecedorCotacao[];
  criadoEm: string;
  atualizadoEm: string;
}

// ===== ORÇAMENTO =====

export type OrcamentoStatus =
  | "RECEBIDO"
  | "PENDENTE_CONFERENCIA"
  | "CONFERIDO"
  | "INVALIDO"
  | "VENCIDO"
  | "SELECIONADO"
  | "RECUSADO";

export interface OrcamentoItem {
  id: string;
  cotacaoItemId: string;
  peca?: Peca;
  marcaCotada?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  disponivel: boolean;
  observacao?: string;
}

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  enviadoPorId: string;
  enviadoEm: string;
}

export interface Orcamento {
  id: string;
  cotacaoId: string;
  fornecedorId: string;
  fornecedor?: Fornecedor;
  dataOrcamento: string;
  validadePropostaDias?: number;
  prazoEntrega?: string;
  valorFrete: number;
  formaPagamento?: string;
  observacoes?: string;
  status: OrcamentoStatus;
  itens: OrcamentoItem[];
  anexos: Anexo[];
  criadoEm: string;
}

// ===== REQUISIÇÃO =====

export type RequisicaoStatus =
  | "RASCUNHO"
  | "AGUARDANDO_APROVACAO"
  | "APROVADA"
  | "REPROVADA"
  | "SOLICITAR_AJUSTE"
  | "PEDIDO_FECHADO"
  | "AGUARDANDO_ENTREGA"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA"
  | "FINALIZADA"
  | "CANCELADA";

export type ItemEntregaStatus =
  | "AGUARDANDO_COMPRA"
  | "COMPRADA"
  | "AGUARDANDO_ENTREGA"
  | "RECEBIDA_PARCIALMENTE"
  | "RECEBIDA"
  | "COM_PROBLEMA"
  | "DEVOLVIDA"
  | "CANCELADA";

export type CondicaoPeca = "OK" | "DANIFICADA" | "INCORRETA" | "PARCIAL";

export interface RequisicaoItem {
  id: string;
  pecaId: string;
  peca?: Peca;
  fornecedorId: string;
  fornecedor?: Fornecedor;
  orcamentoItemId: string;
  marca?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  justificativa?: string;
  statusEntrega: ItemEntregaStatus;
  quantidadeRecebida: number;
  previsaoEntrega?: string;
  dataRecebimento?: string;
  quemRecebeu?: string;
  condicaoPeca?: CondicaoPeca;
  observacaoRecebimento?: string;
}

export interface HistoricoRequisicao {
  id: string;
  data: string;
  acao: string;
  usuarioId: string;
  usuario?: User;
  comentario?: string;
  statusAnterior?: RequisicaoStatus;
  statusNovo?: RequisicaoStatus;
}

export interface Requisicao {
  id: string;
  numero: string;
  cotacaoId: string;
  cotacao?: Cotacao;
  solicitanteId: string;
  solicitante?: User;
  setor: string;
  urgencia: Urgencia;
  status: RequisicaoStatus;
  valorTotal: number;
  justificativa?: string;
  itens: RequisicaoItem[];
  anexos: Anexo[];
  aprovadorId?: string;
  aprovador?: User;
  dataAprovacao?: string;
  comentarioAprovador?: string;
  dataFechamentoPedido?: string;
  previsaoEntregaGeral?: string;
  formaPagamento?: string;
  historico: HistoricoRequisicao[];
  criadoEm: string;
  atualizadoEm: string;
}

// ===== REQUISIÇÃO DE COMPRA (documento simplificado para impressão) =====

export type PurchaseRequisitionStatus = "RASCUNHO" | "GERADA" | "IMPRESSA" | "CANCELADA";

export interface PurchaseRequisitionItem {
  id: string;
  peca: string;
  quantidade: number;
  valorUnitario: number;
  observacao: string;
}

export interface PurchaseRequisition {
  id: string;
  cotacaoId: string;
  cotacaoCodigo: string;
  numero: string;
  data: string;
  solicitante: string;
  responsavel: string;
  observacaoGeral: string;
  itens: PurchaseRequisitionItem[];
  status: PurchaseRequisitionStatus;
  criadoEm: string;
  atualizadoEm: string;
}
