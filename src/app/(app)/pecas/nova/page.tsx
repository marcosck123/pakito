"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { UnidadeMedida } from "@/types";

const unidades: UnidadeMedida[] = ["UNIDADE", "PAR", "JOGO", "CAIXA", "LITRO", "METRO", "KG"];
const categorias = ["Filtros", "Correias", "Freios", "Óleos", "Fluidos", "Rolamentos", "Sensores", "Elétrico", "Suspensão", "Outros"];

export default function NovaPecaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    alert("Peça cadastrada com sucesso! (mock)");
    router.push("/pecas");
  }

  return (
    <div className="space-y-6">
      <Link href="/pecas" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Peças
      </Link>

      <h1 className="text-xl font-bold text-gray-900">Nova peça</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Dados obrigatórios</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome da peça <span className="text-red-500">*</span></label>
            <input type="text" name="nome" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Unidade de medida <span className="text-red-500">*</span></label>
              <select name="unidade" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Dados complementares</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Código interno</label><input type="text" name="codigoInterno" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Código original</label><input type="text" name="codigoOriginal" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
              <select name="categoria" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="">Selecionar...</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Marca preferencial</label><input type="text" name="marcaPreferencial" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Estoque mínimo</label><input type="number" name="estoqueMinimo" min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Aplicação</label><input type="text" name="aplicacao" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Ex: Motor 1.0 flex, Caminhão..." /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Descrição / Observações</label><textarea name="descricao" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar peça"}
          </button>
          <Link href="/pecas" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}