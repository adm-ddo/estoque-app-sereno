import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import { analisarProduto } from "@/lib/analise-consumo";
import { calcularComprasDiretas } from "@/lib/compras-diretas";
import { calcularValorEstoque } from "@/lib/cmv";
import { inicioDoMesBrasil } from "@/lib/data";
import ConsumoChart from "./ConsumoChart";
import AjudaTela from "@/components/AjudaTela";

function formatarReal(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function RelatoriosPage() {
  const sessao = await requireTenant();
  const restauranteId = sessao.restauranteEfetivoId;

  const [produtos, comprasDiretoMes] = await Promise.all([
    prisma.produto.findMany({
      where: { restauranteId, pedidoDireto: false },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, unidade: true, estoqueRegulador: true, preco: true },
    }),
    calcularComprasDiretas(restauranteId, inicioDoMesBrasil(new Date())),
  ]);

  const itens = await prisma.contagemItem.findMany({
    where: { contagem: { restauranteId: sessao.restauranteEfetivoId } },
    select: {
      produtoId: true,
      quantidadeContada: true,
      contagem: { select: { id: true, data: true } },
    },
    orderBy: { contagem: { data: "asc" } },
  });

  const itensPorProduto = new Map<
    number,
    { contagemId: number; data: Date; quantidadeContada: number }[]
  >();
  for (const item of itens) {
    const lista = itensPorProduto.get(item.produtoId) ?? [];
    lista.push({
      contagemId: item.contagem.id,
      data: item.contagem.data,
      quantidadeContada: item.quantidadeContada,
    });
    itensPorProduto.set(item.produtoId, lista);
  }

  const analises = produtos.map((produto) =>
    analisarProduto(produto, itensPorProduto.get(produto.id) ?? [])
  );

  // Valor teórico se a loja estivesse 100% abastecida — assume que todo
  // produto (exceto pedido direto, que não tem regulador) está exatamente
  // no estoque regulador dele. Não é o valor atual em estoque, é um teto:
  // "se eu pedir sempre o mínimo, no dia seguinte à entrega esse é
  // aproximadamente o valor parado em insumos".
  const valorEstoqueMaximo = calcularValorEstoque(
    produtos.map((p) => ({ quantidadeContada: p.estoqueRegulador, preco: p.preco }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Relatórios</h1>
        <p className="text-stone-600 mt-1 text-sm">
          Evolução do consumo semanal estimado de cada produto, a partir das
          suas contagens. É uma estimativa (assume que os pedidos sugeridos
          foram recebidos por completo) — serve pra identificar tendências e
          discrepâncias, não como controle contábil exato.
        </p>
      </div>

      <AjudaTela>
        <p>
          Aqui você acompanha, semana a semana, como anda o consumo de cada
          produto. Conforme as Ordens de Compra vão se acumulando, o sistema
          te dá mais clareza sobre padrões de saída e ajuda a perceber
          quando alguma coisa foge do normal.
        </p>
        <p>
          Produtos marcados como pedido direto não entram nesses gráficos —
          como não usam mais estoque regulador, o pedido já vira direto o
          valor comprado, que você vê logo abaixo somado no mês.
        </p>
        <p>
          O card 📦 abaixo mostra quanto valeria seu estoque se cada produto
          estivesse exatamente no regulador — útil pra ter uma ideia do
          teto de capital parado em insumos quando você pede sempre o
          mínimo.
        </p>
      </AjudaTela>

      {valorEstoqueMaximo.itensComPreco > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-2xl font-semibold text-sky-900">
            {formatarReal(valorEstoqueMaximo.valorTotal)}
          </p>
          <p className="text-xs text-sky-700">
            📦 Valor de estoque se estivesse 100% abastecido — soma do
            estoque regulador × preço de cada produto (baseado em{" "}
            {valorEstoqueMaximo.itensComPreco}{" "}
            {valorEstoqueMaximo.itensComPreco === 1 ? "produto" : "produtos"}{" "}
            com preço cadastrado). É o teto: se você sempre pedir o mínimo
            (regulador), esse é aproximadamente o valor parado em insumos
            assim que a entrega chega. Não inclui produtos de pedido direto,
            que não têm regulador fixo.
          </p>
        </div>
      )}

      {comprasDiretoMes > 0 && (
        <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4 shadow-sm">
          <p className="text-2xl font-semibold text-lime-900">
            {formatarReal(comprasDiretoMes)}
          </p>
          <p className="text-xs text-lime-700">
            🛒 Compras diretas este mês — soma dos pedidos, não é uma
            estimativa. Itens por peso (kg), como Hortifrúti, podem chegar
            com valor um pouco diferente do pedido, já que o fornecedor
            separa pelo peso real na hora da entrega.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {analises.map((analise) => (
          <div
            key={analise.produtoId}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-stone-800">{analise.nome}</p>
                <p className="text-xs text-stone-500">
                  Regulador atual: {analise.estoqueRegulador} {analise.unidade}
                </p>
              </div>
              {analise.alerta && (
                <span className="shrink-0 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium px-2 py-0.5">
                  ⚠️ Fora do padrão
                </span>
              )}
            </div>

            {!analise.dadosSuficientes ? (
              <p className="text-sm text-stone-500">
                Ainda não há contagens suficientes pra esse produto (precisa
                de pelo menos algumas semanas de histórico).
              </p>
            ) : (
              <>
                <ConsumoChart analise={analise} />
                <div className="text-sm text-stone-700">
                  Última semana: <strong>{analise.consumoUltimaSemana}</strong>{" "}
                  {analise.unidade} · Média:{" "}
                  <strong>{analise.mediaConsumo?.toFixed(1)}</strong>{" "}
                  {analise.unidade}
                  {analise.desvioPercentual !== null && (
                    <>
                      {" "}
                      ·{" "}
                      <span
                        className={
                          analise.alerta ? "text-amber-700 font-medium" : ""
                        }
                      >
                        {analise.desvioPercentual >= 0 ? "+" : ""}
                        {(analise.desvioPercentual * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
                {analise.sugestaoAumentarRegulador && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
                    💡 O consumo recente está próximo ou acima do estoque
                    regulador ({analise.estoqueRegulador} {analise.unidade}).
                    Considere aumentá-lo pra evitar ficar sem estoque.
                  </p>
                )}
              </>
            )}
          </div>
        ))}
        {analises.length === 0 && (
          <p className="text-stone-500 text-sm">
            Nenhum produto cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
