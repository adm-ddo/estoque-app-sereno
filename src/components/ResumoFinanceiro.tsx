import type { ValorEstoque, CmvSemana } from "@/lib/cmv";

function formatarReal(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function produtoOuProdutos(quantidade: number): string {
  return quantidade === 1 ? "produto" : "produtos";
}

export default function ResumoFinanceiro({
  valorEstoque,
  cmvSemana,
  comprasDiretoSemana = 0,
  valorCategoriasProprias = [],
}: {
  valorEstoque: ValorEstoque;
  cmvSemana: CmvSemana;
  /** Soma exata (não estimada) do que já foi pedido em modo pedido direto
   * (produtos sem estoque regulador confiável, de qualquer categoria) nesta
   * semana — esses produtos não entram no cálculo de consumo por não ter
   * estoque regulador, então somam à parte no CMV. */
  comprasDiretoSemana?: number;
  /** Valor do estoque atual de categorias com Ordem de Compra própria
   * (Bebidas, Embalagens) — não fazem parte da contagem semanal, então
   * vêm da última contagem própria de cada uma e somam à parte no total. */
  valorCategoriasProprias?: { label: string; valorTotal: number }[];
}) {
  const totalItens = valorEstoque.itensComPreco + valorEstoque.itensSemPreco;
  const valorCategoriasPropriasTotal = valorCategoriasProprias.reduce(
    (soma, c) => soma + c.valorTotal,
    0
  );
  const valorEstoqueTotal = valorEstoque.valorTotal + valorCategoriasPropriasTotal;
  const temCmvBase = cmvSemana.produtosConsiderados > 0;
  const temComprasDireto = comprasDiretoSemana > 0;
  const cmvTotal = cmvSemana.valorEstimado + comprasDiretoSemana;

  if (totalItens === 0 && !temComprasDireto) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      <h2 className="font-medium text-stone-800">Resumo financeiro</h2>

      {totalItens > 0 && (
        <div>
          <p className="text-2xl font-semibold text-stone-800">
            {formatarReal(valorEstoqueTotal)}
          </p>
          <p className="text-xs text-stone-500">
            Valor total em estoque agora
            {valorEstoque.itensSemPreco > 0 && (
              <>
                {" "}
                (baseado em {valorEstoque.itensComPreco} de {totalItens}{" "}
                {produtoOuProdutos(totalItens)} com preço cadastrado)
              </>
            )}
            {valorCategoriasProprias.length > 0 && (
              <>
                {" "}
                · inclui{" "}
                {valorCategoriasProprias
                  .map((c) => `${c.label} (${formatarReal(c.valorTotal)})`)
                  .join(" e ")}
                , da última contagem própria de cada uma.
              </>
            )}
          </p>
        </div>
      )}

      <div className="border-t border-stone-100 pt-3">
        {temCmvBase || temComprasDireto ? (
          <>
            <p className="text-2xl font-semibold text-stone-800">
              {formatarReal(cmvTotal)}
            </p>
            <p className="text-xs text-stone-500">
              Estimativa de insumos gastos essa semana
              {temCmvBase && (
                <>
                  {" "}
                  (baseado em {cmvSemana.produtosConsiderados}{" "}
                  {produtoOuProdutos(cmvSemana.produtosConsiderados)} com preço
                  e histórico suficiente)
                </>
              )}
              . Assume que o pedido sugerido da semana passada foi recebido
              por completo — é uma estimativa, não um valor contábil exato.
              {temComprasDireto && (
                <>
                  {" "}
                  Inclui {formatarReal(comprasDiretoSemana)} já pedidos em
                  modo pedido direto essa semana (baseado na quantidade
                  pedida, não estimado — mas itens por peso, como
                  Hortifrúti, podem chegar com valor um pouco diferente do
                  que o fornecedor separar).
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-xs text-stone-500">
            Ainda não dá pra estimar o CMV da semana — precisa de pelo menos
            uma contagem anterior e preço cadastrado nos produtos.
          </p>
        )}
      </div>
    </div>
  );
}
