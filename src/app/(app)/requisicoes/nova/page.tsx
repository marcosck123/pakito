import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ cotacao?: string }>;
}

export default async function RequisicoesNovaPage({ searchParams }: Props) {
  const { cotacao } = await searchParams;
  if (cotacao) redirect(`/cotacoes/${cotacao}`);
  redirect("/requisicoes");
}
