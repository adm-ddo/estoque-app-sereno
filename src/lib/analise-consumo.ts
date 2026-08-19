/**
 * Estimativa de consumo semanal a partir do que já é coletado (contagem +
 * estoque regulador), sem exigir confirmação de quanto foi realmente
 * recebido em cada compra. Isso tem uma margem de erro conhecida: assume
 * que o pedido sugerido em cada contagem foi recebido por completo, e usa
 * o estoque regulador ATUAL do produto (não há histórico de regulador por
 * contagem no schema hoje, então mudanças recentes no regulador afetam a
 * precisão de pontos mais antigos). Ainda assim, é o suficiente pra pegar
 * discrepâncias grandes (o caso que importa: "usamos 80kg, essa semana
 * foram 120kg").
 */

// Heurísticas ajustáveis — não são requisito exato do usuário.
export const LIMIAR_ALERTA = 0.4; // 40% de desvio da média já dispara alerta
const MINIMO_PONTOS = 3; // mínimo de semanas com consumo válido antes de calcular média/alerta
const LIMIAR_SUGESTAO_REGULADOR = 0.85; // média >= 85% do regulador sugere aumentar

/** Assumir "repôs até o estoque regulador" só faz sentido se deu tempo real
 * de repor entre as duas contagens. Contagens muito próximas (reenvio,
 * duplo clique, editar/testar de novo no mesmo dia) não representam uma
 * semana de consumo de verdade — sem essa trava, o cálculo inventa um
 * "consumo" do tamanho do regulador inteiro em questão de minutos. */
const GAP_MINIMO_HORAS = 20;

export type PontoConsumo = {
  contagemId: number;
  data: Date;
  quantidadeContada: number;
  consumoEstimado: number | null; // null no primeiro ponto (não há anterior pra comparar)
  inconsistente: boolean; // consumoEstimado < 0 (chegou mais estoque do que o esperado, ou regulador mudou)
};

export type AnaliseProduto = {
  produtoId: number;
  nome: string;
  unidade: string;
  estoqueRegulador: number;
  pontos: PontoConsumo[];
  mediaConsumo: number | null;
  consumoUltimaSemana: number | null;
  desvioPercentual: number | null;
  alerta: boolean;
  dadosSuficientes: boolean;
  sugestaoAumentarRegulador: boolean;
};

type ContagemDoProduto = {
  contagemId: number;
  data: Date;
  quantidadeContada: number;
};

export function analisarProduto(
  produto: {
    id: number;
    nome: string;
    unidade: string;
    estoqueRegulador: number;
  },
  contagensOrdenadas: ContagemDoProduto[]
): AnaliseProduto {
  const pontos: PontoConsumo[] = contagensOrdenadas.map((c, i) => {
    if (i === 0) {
      return {
        contagemId: c.contagemId,
        data: c.data,
        quantidadeContada: c.quantidadeContada,
        consumoEstimado: null,
        inconsistente: false,
      };
    }
    const anterior = contagensOrdenadas[i - 1];
    const horasDesdeAnterior =
      (c.data.getTime() - anterior.data.getTime()) / (60 * 60 * 1000);
    if (horasDesdeAnterior < GAP_MINIMO_HORAS) {
      // Contagens próximas demais pra representar uma reposição real —
      // trata como se não houvesse ponto anterior válido pra comparar.
      return {
        contagemId: c.contagemId,
        data: c.data,
        quantidadeContada: c.quantidadeContada,
        consumoEstimado: null,
        inconsistente: false,
      };
    }
    const estoqueInicialEstimado = Math.max(
      anterior.quantidadeContada,
      produto.estoqueRegulador
    );
    const consumoEstimado = estoqueInicialEstimado - c.quantidadeContada;
    return {
      contagemId: c.contagemId,
      data: c.data,
      quantidadeContada: c.quantidadeContada,
      consumoEstimado,
      inconsistente: consumoEstimado < 0,
    };
  });

  const consumosValidos = pontos.filter(
    (p) => p.consumoEstimado !== null && !p.inconsistente
  ) as (PontoConsumo & { consumoEstimado: number })[];

  const ultimoPonto = pontos[pontos.length - 1] ?? null;
  const consumoUltimaSemana =
    ultimoPonto && !ultimoPonto.inconsistente ? ultimoPonto.consumoEstimado : null;

  const historicoSemUltima = consumosValidos.filter(
    (p) => p.contagemId !== ultimoPonto?.contagemId
  );
  const dadosSuficientes = historicoSemUltima.length >= MINIMO_PONTOS;

  const mediaConsumo = dadosSuficientes
    ? historicoSemUltima.reduce((soma, p) => soma + p.consumoEstimado, 0) /
      historicoSemUltima.length
    : null;

  const desvioPercentual =
    mediaConsumo !== null && mediaConsumo > 0 && consumoUltimaSemana !== null
      ? (consumoUltimaSemana - mediaConsumo) / mediaConsumo
      : null;

  const alerta =
    dadosSuficientes &&
    desvioPercentual !== null &&
    Math.abs(desvioPercentual) >= LIMIAR_ALERTA;

  const mediaRecente =
    mediaConsumo !== null && consumoUltimaSemana !== null
      ? (mediaConsumo + consumoUltimaSemana) / 2
      : mediaConsumo;
  const sugestaoAumentarRegulador =
    dadosSuficientes &&
    mediaRecente !== null &&
    produto.estoqueRegulador > 0 &&
    mediaRecente >= produto.estoqueRegulador * LIMIAR_SUGESTAO_REGULADOR;

  return {
    produtoId: produto.id,
    nome: produto.nome,
    unidade: produto.unidade,
    estoqueRegulador: produto.estoqueRegulador,
    pontos,
    mediaConsumo,
    consumoUltimaSemana,
    desvioPercentual,
    alerta,
    dadosSuficientes,
    sugestaoAumentarRegulador,
  };
}
