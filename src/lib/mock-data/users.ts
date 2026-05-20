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

// Hashes bcrypt da senha "1234" (custo 10). Substitua por senhas reais antes de produção.
export const mockCredentials: Record<string, string> = {
  "carlos@empresa.com": "$2b$10$O6k3qcDy2Likt//yDoziaeW68hXZ77CCm513u2iW6t79SfHzY13Ga",
  "ana@empresa.com":    "$2b$10$O6k3qcDy2Likt//yDoziaeW68hXZ77CCm513u2iW6t79SfHzY13Ga",
  "joao@empresa.com":   "$2b$10$O6k3qcDy2Likt//yDoziaeW68hXZ77CCm513u2iW6t79SfHzY13Ga",
  "marcos@empresa.com": "$2b$10$O6k3qcDy2Likt//yDoziaeW68hXZ77CCm513u2iW6t79SfHzY13Ga",
  "paulo@empresa.com":  "$2b$10$O6k3qcDy2Likt//yDoziaeW68hXZ77CCm513u2iW6t79SfHzY13Ga",
  "sandra@empresa.com": "$2b$10$O6k3qcDy2Likt//yDoziaeW68hXZ77CCm513u2iW6t79SfHzY13Ga",
};
