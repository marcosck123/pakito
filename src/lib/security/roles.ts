import type { UserRole } from "@/types";

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  COMPRAS: "Compras",
  SOLICITANTE: "Solicitante",
  APROVADOR: "Aprovador",
  RECEBIMENTO: "Recebimento",
  VISUALIZADOR: "Visualizador",
};

export const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  COMPRAS: "bg-blue-100 text-blue-800",
  SOLICITANTE: "bg-green-100 text-green-800",
  APROVADOR: "bg-orange-100 text-orange-800",
  RECEBIMENTO: "bg-cyan-100 text-cyan-800",
  VISUALIZADOR: "bg-gray-100 text-gray-700",
};
