import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import { createContagem, updateContagem } from "../actions";
import { calcularStatusCiclo, whereProdutosEscopo } from "@/lib/contagem";
import { formatarDataCurta } from "@/lib/data";
import { labelFrequencia } from "@/lib/frequencia";
import {
  LOCAIS_ORDEM,
  LOCAL_INFO,
  type LocalArmazenamento,
} from "@/lib/locais";
import ContagemFormFields from "@/components/ContagemFormFields";

export default async function NovaContagemPage({
  searchParams,
}: {
  searchParams: Promise<{ local?: string; editar?: string; rapido?: string }>;
}) {
  const sessao = await requireTenant();
  const restauranteId = sessao.restauranteEfetivoId;
  const { local: localParam, editar: editarParam, rapido: rapidoParam } = await searchParams;
  const pedidoRapido = rapidoParam === "1";
  const local =
    !pedidoRapido && (LOCAIS_ORDEM as string[]).includes(localParam ?? "")
      ? (localParam as LocalArmazenamento)
      : null;

  const contagemEditandoId = editarParam ? Number(editarParam) : null;
  let quantidadesIniciais: Map<number, number> | null = null;

  if (contagemEditandoId !== null) {
    if (Number.isNaN(contagemEditandoId)) notFound();
    const contagemExistente = await prisma.contagem.findFirst({
      where: { id: contagemEditandoId, restauranteId },
      select: { itens: { select: { produtoId: true, quantidadeContada: true } } },
    });
    if (!contagemExistente) notFound();
    quantidadesIniciais = new Map(
      contagemExistente.itens.map((item) => [item.produtoId, item.quantidadeContada])
    );
  }

  const editando = contagemEditandoId !== null;

  const [produtos, restaurante] = await Promise.all([
    prisma.produto.findMany({
      where: whereProdutosEscopo(restauranteId, local, pedidoRapido),
      orderBy: { nome: "asc" },
    }),
    prisma.restaurante.findUniqueOrThrow({
      where: { id: restauranteId },
      select: { frequenciaEstoquePadraoDias: true },
    }),
  ]);

  const tituloEscopo = pedidoRapido ? "Pedido Rápido" : local ? LOCAL_INFO[local].label : null;
  const tituloBase = editando ? "Editar Contagem" : "Nova Contagem";
  const temItemPorPeso = produtos.some(
    (p) => p.pedidoDireto && (p.unidade === "KG" || p.unidade === "GR")
  );

  if (produtos.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-stone-800">
          {tituloEscopo ? `${tituloBase} — ${tituloEscopo}` : tituloBase}
        </h1>
        <p className="text-stone-600 text-sm">
          {local ? (
            <>Você ainda não cadastrou produtos de {tituloEscopo}.</>
          ) : pedidoRapido ? (
            <>Você ainda não marcou nenhum produto como Pedido Rápido.</>
          ) : (
            <>Você ainda não cadastrou nenhum produto.</>
          )}{" "}
          <Link href="/produtos" className="text-emerald-700 underline">
            Cadastre produtos
          </Link>{" "}
          antes de fazer a contagem.
        </p>
      </div>
    );
  }

  // Escopo por categoria ou Pedido Rápido espera item por item todo dia; o
  // fluxo completo espera na cadência padrão da loja. Item mais lento que
  // isso fica em destaque e, se ainda dentro do próprio ciclo, começa
  // travado — só ao editar (já revisando de propósito) ou se o produto for
  // Pedido Rápido isso some.
  const baselineDias = local || pedidoRapido ? 1 : restaurante.frequenciaEstoquePadraoDias;
  const statusCiclo = editando
    ? null
    : await calcularStatusCiclo(produtos, restaurante.frequenciaEstoquePadraoDias);

  const produtosComStatus = produtos.map((p) => {
    const frequenciaEfetiva = p.frequenciaEstoqueDias ?? restaurante.frequenciaEstoquePadraoDias;
    const status = statusCiclo?.get(p.id);
    return {
      ...p,
      quantidadeInicial:
        quantidadesIniciais?.get(p.id) ?? (p.pedidoDireto ? p.pedidoMinimo : null),
      destacarAtencao: frequenciaEfetiva > baselineDias,
      avisoCiclo:
        status?.jaContadoNoCiclo && status.ultimaContagemData
          ? `Já contado em ${formatarDataCurta(status.ultimaContagemData)} · ${labelFrequencia(status.frequenciaEfetivaDias)}`
          : null,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          {tituloEscopo ? `${tituloBase} — ${tituloEscopo}` : tituloBase}
        </h1>
        <p className="text-stone-600 mt-1 text-sm">
          {editando
            ? pedidoRapido
              ? "Ajuste as quantidades e salve — isso atualiza o Pedido Rápido já feito hoje."
              : "Ajuste as quantidades e salve — isso atualiza a Ordem de Compra já feita hoje."
            : pedidoRapido
              ? "Fora do ritmo semanal — confira o que tem e peça quando precisar."
              : "Informe a quantidade atual de cada produto no estoque."}
          {" "}Itens marcados &quot;pedido direto&quot; não têm estoque regulador — é só escrever quanto você quer pedir.
        </p>
        {temItemPorPeso && (
          <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            ⚠️ Itens por peso (kg) podem chegar com um valor um pouco
            diferente do pedido — o fornecedor separa pelo peso real na hora
            da entrega, dificilmente vai bater exatamente no kg.
          </p>
        )}
      </div>

      <ContagemFormFields
        produtos={produtosComStatus}
        pedidoRapido={pedidoRapido}
        action={
          editando
            ? updateContagem.bind(null, contagemEditandoId!, local, pedidoRapido)
            : createContagem.bind(null, local, pedidoRapido)
        }
      />
    </div>
  );
}
