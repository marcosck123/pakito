import type { PurchaseRequisition } from "@/types";

const store: PurchaseRequisition[] = [];
let counter = 1;

export function findByCotacaoId(cotacaoId: string): PurchaseRequisition | null {
  return store.find((r) => r.cotacaoId === cotacaoId && !r.fornecedorNome) ?? null;
}

export function findByCotacaoIdAndFornecedor(
  cotacaoId: string,
  fornecedorNome: string
): PurchaseRequisition | null {
  return store.find((r) => r.cotacaoId === cotacaoId && r.fornecedorNome === fornecedorNome) ?? null;
}

export function upsert(
  data: Omit<PurchaseRequisition, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }
): PurchaseRequisition {
  const now = new Date().toISOString();
  const idx = data.id
    ? store.findIndex((r) => r.id === data.id)
    : store.findIndex(
        (r) =>
          r.cotacaoId === data.cotacaoId &&
          (r.fornecedorNome ?? "") === (data.fornecedorNome ?? "")
      );

  if (idx >= 0) {
    store[idx] = { ...store[idx], ...data, id: store[idx].id, atualizadoEm: now };
    return store[idx];
  }

  const created: PurchaseRequisition = {
    ...data,
    id: `pr${counter++}`,
    criadoEm: now,
    atualizadoEm: now,
  };
  store.push(created);
  return created;
}
