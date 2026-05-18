"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const categoriaOpcoes = [
  "Filtros", "Correias", "Pastilhas", "Freios", "Óleos", "Fluidos",
  "Rolamentos", "Sensores", "Elétrico", "Suspensão", "Parafusos", "Outros",
];

export default function NovoFornecedorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);

  function toggleCategoria(cat: string) {
    setCategorias((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    alert("Fornecedor cadastrado com sucesso! (mock)");
    router.push("/fornecedores");
  }

  return (
    <div className="space-y-6">
      <Link href="/fornecedores" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Fornecedores
      </Link>

      <h1 className="text-xl font-bold text-gray-900">Novo fornecedor</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Dados obrigatórios</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome da loja / fornecedor <span className="text-red-500">*</span></label>
            <input type="text" name="nome" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Telefone / WhatsApp <span className="text-red-500">*</span></label>
            <input type="text" name="telefone" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="(11) 99999-0000" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Dados complementares</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Nome do vendedor</label><input type="text" name="nomeVendedor" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label><input type="email" name="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Cidade</label><input type="text" name="cidade" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">CNPJ</label><input type="text" name="cnpj" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="00.000.000/0001-00" /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Endereço</label><input type="text" name="endereco" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Categorias fornecidas</label>
            <div className="flex flex-wrap gap-2">
              {categoriaOpcoes.map((cat) => (
                <button key={cat} type="button" onClick={() => toggleCategoria(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    categorias.includes(cat) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Observações internas</label><textarea name="observacoes" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar fornecedor"}
          </button>
          <Link href="/fornecedores" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}