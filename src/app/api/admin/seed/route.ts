import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { db } from "@/lib/db/firebase-admin";
import { mockFornecedores } from "@/lib/mock-data/fornecedores";
import { mockPecas } from "@/lib/mock-data/pecas";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { mockOrcamentos } from "@/lib/mock-data/orcamentos";
import { mockRequisicoes } from "@/lib/mock-data/requisicoes";
import { mockUsers, mockCredentials } from "@/lib/mock-data/users";

export const runtime = "nodejs";

export async function POST() {
  const { error } = await requireSession(["ADMIN"]);
  if (error) return error;

  try {
    const results: Record<string, number> = {};

    // Seed fornecedores
    {
      const batch = db.batch();
      for (const item of mockFornecedores) {
        batch.set(db.collection("fornecedores").doc(item.id), item);
      }
      await batch.commit();
      results.fornecedores = mockFornecedores.length;
    }

    // Seed pecas
    {
      const batch = db.batch();
      for (const item of mockPecas) {
        batch.set(db.collection("pecas").doc(item.id), item);
      }
      await batch.commit();
      results.pecas = mockPecas.length;
    }

    // Seed cotacoes (strip nested user/fornecedor/peca objects to avoid circular refs)
    {
      const batch = db.batch();
      for (const c of mockCotacoes) {
        const doc = {
          ...c,
          solicitante: undefined,
          itens: c.itens.map(({ peca: _peca, ...item }) => item),
          fornecedores: c.fornecedores.map(({ fornecedor: _f, ...fc }) => fc),
        };
        batch.set(db.collection("cotacoes").doc(c.id), doc);
      }
      await batch.commit();
      // Set counter
      await db.doc("_counters/cotacoes").set({ next: mockCotacoes.length + 1 });
      results.cotacoes = mockCotacoes.length;
    }

    // Seed orcamentos (strip nested objects)
    {
      const batch = db.batch();
      for (const o of mockOrcamentos) {
        const doc = {
          ...o,
          fornecedor: undefined,
          itens: o.itens.map(({ peca: _peca, ...item }) => item),
        };
        batch.set(db.collection("orcamentos").doc(o.id), doc);
      }
      await batch.commit();
      results.orcamentos = mockOrcamentos.length;
    }

    // Seed requisicoes (strip nested objects)
    {
      const batch = db.batch();
      for (const r of mockRequisicoes) {
        const doc = {
          ...r,
          cotacao: undefined,
          solicitante: undefined,
          aprovador: undefined,
          itens: r.itens.map(({ peca: _peca, fornecedor: _f, ...item }) => item),
          historico: r.historico.map(({ usuario: _u, ...h }) => h),
        };
        batch.set(db.collection("requisicoes").doc(r.id), doc);
      }
      await batch.commit();
      // Set counter
      await db.doc("_counters/requisicoes").set({ next: mockRequisicoes.length + 1 });
      results.requisicoes = mockRequisicoes.length;
    }

    // Seed usuarios with passwordHash
    {
      const batch = db.batch();
      for (const u of mockUsers) {
        const passwordHash = mockCredentials[u.email] ?? "";
        batch.set(db.collection("usuarios").doc(u.id), { ...u, passwordHash });
      }
      await batch.commit();
      results.usuarios = mockUsers.length;
    }

    return NextResponse.json({ seeded: results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao fazer seed." },
      { status: 500 }
    );
  }
}
