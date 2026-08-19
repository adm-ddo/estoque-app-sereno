/**
 * Valor de estoque e CMV (custo da mercadoria vendida) estimado, a partir do
 * preço cadastrado em cada produto e do consumo estimado já calculado em
 * analise-consumo.ts. Usa o preço ATUAL do produto (não o histórico exato de
 * cada semana) — mais simples, e como preço não muda com muita frequência
 * (lembrete é a cada 30 dias), a diferença é pequena na prática. O histórico
 * em ProdutoPreco já fica disponível caso essa precisão maior seja pedida no
 * futuro.
 */

export type ValorEstoque = {
  valorTotal: number;
  itensComPreco: number;
  itensSemPreco: number;
};

export function calcularValorEstoque(
  itens: { quantidadeContada: number; preco: number | null }[]
): ValorEstoque {
  let valorTotal = 0;
  let itensComPreco = 0;
  let itensSemPreco = 0;

  for (const item of itens) {
    if (item.preco === null) {
      itensSemPreco++;
      continue;
    }
    valorTotal += item.quantidadeContada * item.preco;
    itensComPreco++;
  }

  return { valorTotal, itensComPreco, itensSemPreco };
}

export type CmvSemana = {
  valorEstimado: number;
  produtosConsiderados: number;
  produtosSemPreco: number;
  produtosSemDadosSuficientes: number;
};

export function calcularCmvSemana(
  itens: { consumoUltimaSemana: number | null; preco: number | null }[]
): CmvSemana {
  let valorEstimado = 0;
  let produtosConsiderados = 0;
  let produtosSemPreco = 0;
  let produtosSemDadosSuficientes = 0;

  for (const item of itens) {
    // null cobre tanto "primeira contagem, sem anterior pra comparar"
    // quanto "inconsistente" (chegou mais estoque que o esperado).
    if (item.consumoUltimaSemana === null) {
      produtosSemDadosSuficientes++;
      continue;
    }
    if (item.preco === null) {
      produtosSemPreco++;
      continue;
    }
    valorEstimado += item.consumoUltimaSemana * item.preco;
    produtosConsiderados++;
  }

  return {
    valorEstimado,
    produtosConsiderados,
    produtosSemPreco,
    produtosSemDadosSuficientes,
  };
}
