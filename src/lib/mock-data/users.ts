import type { User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "u1",
    nome: "Carlos Admin",
    email: "carlos@empresa.com",
    role: "ADMIN",
    setor: "TI",
    ativo: true,
  },
  {
    id: "u2",
    nome: "Ana Compras",
    email: "ana@empresa.com",
    role: "COMPRAS",
    setor: "Compras",
    ativo: true,
  },
  {
    id: "u3",
    nome: "João Manutenção",
    email: "joao@empresa.com",
    role: "SOLICITANTE",
    setor: "Manutenção",
    ativo: true,
  },
  {
    id: "u4",
    nome: "Marcos Diretor",
    email: "marcos@empresa.com",
    role: "APROVADOR",
    setor: "Diretoria",
    ativo: true,
  },
  {
    id: "u5",
    nome: "Paulo Almoxarife",
    email: "paulo@empresa.com",
    role: "RECEBIMENTO",
    setor: "Almoxarifado",
    ativo: true,
  },
  {
    id: "u6",
    nome: "Sandra Auditoria",
    email: "sandra@empresa.com",
    role: "VISUALIZADOR",
    setor: "Auditoria",
    ativo: true,
  },
];

export const mockCredentials: Record<string, string> = {
  "carlos@empresa.com": "1234",
  "ana@empresa.com": "1234",
  "joao@empresa.com": "1234",
  "marcos@empresa.com": "1234",
  "paulo@empresa.com": "1234",
  "sandra@empresa.com": "1234",
};