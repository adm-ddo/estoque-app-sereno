export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const UNIDADES_QTD = new Set([
  "kg",
  "g",
  "gr",
  "l",
  "lt",
  "ml",
  "un",
  "cx",
  "pct",
  "dz",
  "kilo",
  "kilos",
  "litro",
  "litros",
  "pacote",
  "duzia",
]);

/**
 * Remove um sufixo de tamanho/quantidade do fim do nome, repetidamente
 * (ex: "ketchup 3kg" -> "ketchup", "coca cola 2 l" -> "coca cola").
 */
export function removerSufixoQuantidade(nomeNormalizado: string): string {
  const tokens = nomeNormalizado.split(" ").filter(Boolean);
  let mudou = true;
  while (mudou && tokens.length > 1) {
    mudou = false;
    const ultimo = tokens[tokens.length - 1];

    const mesclado = ultimo.match(
      /^(\d+([.,]\d+)?)(kg|g|gr|l|lt|ml|un|cx|pct|dz)$/
    );
    if (mesclado) {
      tokens.pop();
      mudou = true;
      continue;
    }

    const penultimo = tokens[tokens.length - 2];
    if (
      UNIDADES_QTD.has(ultimo) &&
      penultimo &&
      /^\d+([.,]\d+)?$/.test(penultimo)
    ) {
      tokens.pop();
      tokens.pop();
      mudou = true;
      continue;
    }

    if (/^\d+([.,]\d+)?$/.test(ultimo)) {
      tokens.pop();
      mudou = true;
    }
  }
  return tokens.join(" ");
}

export type ProdutoComparavel = { id: number; nome: string; unidade: string };

export function calcularSimilaridade(nomeA: string, nomeB: string): number {
  const baseA = removerSufixoQuantidade(normalizarNome(nomeA));
  const baseB = removerSufixoQuantidade(normalizarNome(nomeB));
  if (!baseA || !baseB) return 0;
  if (baseA === baseB) return 1;

  const tokensA = new Set(baseA.split(" "));
  const tokensB = new Set(baseB.split(" "));
  const intersecao = [...tokensA].filter((t) => tokensB.has(t)).length;
  const uniao = new Set([...tokensA, ...tokensB]).size;
  return uniao === 0 ? 0 : intersecao / uniao;
}

const LIMIAR_SIMILARIDADE = 0.6;

export function encontrarSimilares<T extends ProdutoComparavel>(
  nomeNovo: string,
  existentes: T[]
): T[] {
  return existentes.filter(
    (p) => calcularSimilaridade(nomeNovo, p.nome) >= LIMIAR_SIMILARIDADE
  );
}
