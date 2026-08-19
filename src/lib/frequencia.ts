export const OPCOES_FREQUENCIA_ESTOQUE = [
  { dias: 1, label: "Diário" },
  { dias: 2, label: "3x por semana" },
  { dias: 4, label: "2x por semana" },
  { dias: 7, label: "1x por semana" },
  { dias: 14, label: "Quinzenal" },
  { dias: 30, label: "Mensal" },
] as const;

export function labelFrequencia(dias: number): string {
  const opcao = OPCOES_FREQUENCIA_ESTOQUE.find((o) => o.dias === dias);
  return opcao ? opcao.label : `A cada ${dias} dias`;
}

export function formatarDias(dias: number): string {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}
