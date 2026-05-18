"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { mockPecas } from "@/lib/mock-data/pecas";
import { mockFornecedores } from "@/lib/mock-data/fornecedores";
import type { Urgencia } from "@/types";

interface ItemForm {
  pecaId: string;
  quantidade: number;
  marcaDesejada: string;
  aceitaSimilar: boolean;
  observacao: string;
}

export default function NovaCotacaoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<ItemForm[]>([
    { pecaId: "", quantidade: 1, marcaDesejada: "", aceitaSimilar: true, observacao: "" },
  ]);
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    titulo: "", setor: "", urgencia: "NORMAL" as Urgencia, dataLimite: "", observacoes: "",
  });

  function addItem() {
    setItens((prev) => [...prev, { pecaId: "", quantidade: 1, marcaDesejada: "", aceitaSimilar: true, observacao: "" }]);
  }
  function removeItem(idx: number) { setItens((prev) => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof ItemForm, value: string | number | boolean) {
    setItens((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }
  function toggleFornecedor(id: string) {
    setFornecedoresSelecionados((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  }

  const pecaMap = Object.fromEntries(mockPecas.map((p) => [p.id, p]));

  function gerarMensagem() {
    const itensTexto = itens.filter((i) => i.pecaId).map((item, idx) => {
      const peca = pecaMap[item.pecaId];
      return `${idx + 1}. ${peca?.nome ?? item.pecaId}\nQuantidade: ${item.quantidade}\n${item.marcaDesejada ? `Marca desejada: ${item.marcaDesejada}` : ""}\nAceita similar: ${item.aceitaSimilar ? "Sim" : "Não"}\n${item.observacao ? `Observação: ${item.observacao}` : ""}`.trim();
    }).join("\n\n");
    return `Olá, preciso de cotação para os itens abaixo:\n\n${itensTexto}\n\nPor favor informar:\n- Valor unitário\n- Valor total\n- Marca\n- Disponibilidade\n- Prazo de entrega\n- Frete, se houver\n- Forma de pagamento\n- Validade da proposta\n\nObrigado.`;
  }

  async function handleFinish() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    alert("Cotação criada com sucesso! (mock)");
    router.push("/cotacoes");
  }

  const fornecedoresAtivos = mockFornecedores.filter((f) => f.status === "ATIVO");

  return (
    <div className="space-y-6">
      <Link href="/cotacoes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Cotações
      </Link>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step === s ? "bg-blue-600 text-white" : step > s ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
            }`}>{s}</div>
            {s < 4 && <div className={`h-0.5 w-12 ${step > s ? "bg-blue-300" : "bg-gray-200"}`} />}
          </div>
        ))}
        <div className="ml-3 text-sm text-gray-500">{["Dados gerais", "Peças", "Fornecedores", "Mensagem"][step - 1]}</div>
      </div>

      {step === 1 && (
        <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Dados gerais da cotação</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Título <span className="text-red-500">*</span></label>
            <input type="text" value={formData.titulo} onChange={(e) => setFormData((d) => ({ ...d, titulo: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Ex: Filtros e correia caminhão 01" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Setor</label>
              <input type="text" value={formData.setor} onChange={(e) => setFormData((d) => ({ ...d, setor: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Urgência</label>
              <select value={formData.urgencia} onChange={(e) => setFormData((d) => ({ ...d, urgencia: e.target.value as Urgencia }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Data limite para resposta</label>
            <input type="date" value={formData.dataLimite} onChange={(e) => setFormData((d) => ({ ...d, dataLimite: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
            <textarea value={formData.observacoes} onChange={(e) => setFormData((d) => ({ ...d, observacoes: e.target.value }))} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <button onClick={() => formData.titulo ? setStep(2) : alert("Informe o título")} className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Próximo: Adicionar peças
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Itens da cotação</h2>
            {itens.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Item {idx + 1}</span>
                  {itens.length > 1 && <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Peça *</label>
                    <select value={item.pecaId} onChange={(e) => updateItem(idx, "pecaId", e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500">
                      <option value="">Selecionar peça...</option>
                      {mockPecas.filter((p) => p.status === "ATIVA").map((p) => (
                        <option key={p.id} value={p.id}>{p.nome} {p.codigoInterno ? `(${p.codigoInterno})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Quantidade *</label>
                    <input type="number" min={1} value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Marca desejada</label>
                    <input type="text" value={item.marcaDesejada} onChange={(e) => updateItem(idx, "marcaDesejada", e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id={`similar-${idx}`} checked={item.aceitaSimilar} onChange={(e) => updateItem(idx, "aceitaSimilar", e.target.checked)} className="rounded" />
                    <label htmlFor={`similar-${idx}`} className="text-sm text-gray-600">Aceita similar</label>
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Observação</label>
                    <input type="text" value={item.observacao} onChange={(e) => updateItem(idx, "observacao", e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600">
              <Plus className="h-4 w-4" />
              Adicionar item
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Voltar</button>
            <button onClick={() => itens.some((i) => i.pecaId) ? setStep(3) : alert("Adicione pelo menos uma peça")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Próximo: Selecionar fornecedores
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Selecionar fornecedores</h2>
            {fornecedoresAtivos.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                <input type="checkbox" checked={fornecedoresSelecionados.includes(f.id)} onChange={() => toggleFornecedor(f.id)} className="rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                  <p className="text-xs text-gray-400">{f.nomeVendedor && `${f.nomeVendedor} · `}{f.cidade && `${f.cidade} · `}{f.telefone}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {f.categorias.slice(0, 3).map((cat) => <span key={cat} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{cat}</span>)}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Voltar</button>
            <button onClick={() => fornecedoresSelecionados.length > 0 ? setStep(4) : alert("Selecione pelo menos um fornecedor")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Próximo: Gerar mensagem
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-2xl space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Mensagem para fornecedores</h2>
              <button onClick={() => { navigator.clipboard.writeText(gerarMensagem()); alert("Mensagem copiada!"); }} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                Copiar mensagem
              </button>
            </div>
            <pre className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans">{gerarMensagem()}</pre>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Fornecedores selecionados ({fornecedoresSelecionados.length}):</p>
              <div className="space-y-2">
                {fornecedoresSelecionados.map((fId) => {
                  const f = mockFornecedores.find((f) => f.id === fId)!;
                  return (
                    <div key={fId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{f.nome}</p>
                        <p className="text-xs text-gray-400">{f.telefone}</p>
                      </div>
                      {f.whatsapp && (
                        <a href={`https://wa.me/${f.whatsapp}?text=${encodeURIComponent(gerarMensagem())}`} target="_blank" rel="noopener noreferrer" className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">Abrir WA</a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Voltar</button>
            <button onClick={handleFinish} disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Salvando..." : "Criar cotação"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}