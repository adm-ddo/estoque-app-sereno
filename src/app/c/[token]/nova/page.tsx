import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarContagemPublica, atualizarContagemPublica } from "../../actions";
import { calcularStatusCiclo, whereProdutosEscopo } from "@/lib/contagem";
import { formatarDataCurta } from "@/lib/data";
import { labelFrequencia } from "@/lib/frequencia";
import {
  LOCAIS_ORDEM,
  LOCAL_INFO,
  type LocalArmazenamento,
} from "@/lib/locais";
import ContagemFormFields from "@/components/ContagemFormFields";

export default async function NovaContagemPublicaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ local?: string; editar?: string; rapido?: string }>;
}) {
  const { token } = await params;
  const { local: localParam, editar: editarParam, rapido: rapidoParam } = await searchParams;
  const pedidoRapido = rapidoParam === "1";
  const local =
    !pedidoRapido && (LOCAIS_ORDEM as string[]).includes(localParam ?? "")
      ? (localParam as LocalArmazenamento)
      : null;

  const restaurante = await prisma.restaurante.findUnique({
    where: { tokenContagem: token },
    select: { id: true, nome: true, frequenciaEstoquePadraoDias: true },
  });
  if (!restaurante) notFound();

  const contagemEditandoId = editarParam ? Number(editarParam) : null;
  let quantidadesIniciais: Map<number, number> | null = null;

  if (contagemEditandoId !== null) {
    if (Number.isNaN(contagemEditandoId)) notFound();
    const contagemExistente = await prisma.contagem.findFirst({
      where: { id: contagemEditandoId, restauranteId: restaurante.id },
      select: { itens: { select: { produtoId: true, quantidadeContada: true } } },
    });
    if (!contagemExistente) notFound();
    quantidadesIniciais = new Map(
      contagemExistente.itens.map((item) => [item.produtoId, item.quantidadeContada])
    );
  }

  const editando = contagemEditandoId !== null;

  const produtos = await prisma.produto.findMany({
    where: whereProdutosEscopo(restaurante.id, local, pedidoRapido),
    orderBy: { nome: "asc" },
  });

  const tituloEscopo = pedidoRapido ? "Pedido Rápido" : local ? LOCAL_INFO[local].label : null;
  const temItemPorPeso = produtos.some(
    (p) => p.pedidoDireto && (p.unidade === "KG" || p.unidade === "GR")
  );

  if (produtos.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-stone-800">
          {restaurante.nome}
          {tituloEscopo ? ` — ${tituloEscopo}` : ""}
        </h1>
        <p className="text-stone-600 text-sm">
          {local ? (
            <>Ainda não há produtos de {tituloEscopo} cadastrados nessa loja.</>
          ) : pedidoRapido ? (
            <>Ainda não há produtos marcados como Pedido Rápido nessa loja.</>
          ) : (
            <>Ainda não há produtos cadastrados nessa loja.</>
          )}{" "}
          Fale com o responsável pra cadastrar os produtos antes da contagem.
        </p>
      </div>
    );
  }

  // Mesma lógica do fluxo interno: escopo por categoria ou Pedido Rápido
  // espera item por item todo dia, o fluxo completo espera na cadência
  // padrão da loja. Item mais lento que isso fica em destaque e, se dentro
  // do próprio ciclo, começa travado — só ao editar ou se for Pedido
  // Rápido isso some.
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
          {restaurante.nome}
          {tituloEscopo ? ` — ${tituloEscopo}` : ""}
        </h1>
        <p className="text-stone-600 mt-1 text-sm">
          {editando
            ? "Ajuste as quantidades e salve — isso atualiza a contagem já feita hoje."
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
            ? atualizarContagemPublica.bind(null, token, contagemEditandoId!, local, pedidoRapido)
            : criarContagemPublica.bind(null, token, local, pedidoRapido)
        }
      />
    </div>
  );
}
