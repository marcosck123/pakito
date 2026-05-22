import { getSession } from "@/lib/auth/session";
import { getPecas } from "@/lib/db/pecas-repo";
import { getFornecedores } from "@/lib/db/fornecedores-repo";
import { NovaCotacaoForm } from "./nova-cotacao-form";

export default async function NovaCotacaoPage() {
  const user = await getSession();
  if (!user) return null;

  const [pecas, fornecedores] = await Promise.all([
    getPecas(),
    getFornecedores(),
  ]);

  return <NovaCotacaoForm pecas={pecas} fornecedores={fornecedores} />;
}
