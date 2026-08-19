export const TIPOS_FEEDBACK = [
  { valor: "SUGESTAO", label: "Sugestão", emoji: "💡" },
  { valor: "DUVIDA", label: "Dúvida", emoji: "❓" },
  { valor: "CRITICA", label: "Crítica", emoji: "📣" },
] as const;

export type TipoFeedback = (typeof TIPOS_FEEDBACK)[number]["valor"];

export function labelTipoFeedback(tipo: string): string {
  const opcao = TIPOS_FEEDBACK.find((t) => t.valor === tipo);
  return opcao ? `${opcao.emoji} ${opcao.label}` : tipo;
}

/** Número que recebe toda sugestão/dúvida/crítica mandada pelo sistema. */
export const WHATSAPP_SUPORTE = "51992826704";
