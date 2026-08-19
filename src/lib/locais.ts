import { LocalArmazenamento } from "@/generated/prisma/enums";

// Ordem pedida pro fluxo de contagem: seco -> refrigerados -> hortifrúti ->
// congelados -> bebidas -> embalagens -> limpeza -> escritório. Vale pra
// qualquer lugar que liste locais (dropdown, tela de contagem, etc), não só
// a contagem.
export const LOCAIS_ORDEM: LocalArmazenamento[] = [
  "ESTOQUE_SECO",
  "GELADEIRA",
  "HORTIFRUTI",
  "FREEZER",
  "BEBIDAS",
  "EMBALAGENS",
  "PRODUTOS_LIMPEZA",
  "MATERIAL_ESCRITORIO",
];

export const LOCAL_INFO: Record<
  LocalArmazenamento,
  { label: string; emoji: string; badge: string; header: string }
> = {
  FREEZER: {
    label: "Freezer",
    emoji: "❄️",
    badge: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    header: "text-indigo-700",
  },
  GELADEIRA: {
    label: "Geladeira",
    emoji: "🧊",
    badge: "bg-sky-100 text-sky-700 border border-sky-200",
    header: "text-sky-700",
  },
  ESTOQUE_SECO: {
    label: "Estoque Seco",
    emoji: "📦",
    badge: "bg-amber-100 text-amber-800 border border-amber-200",
    header: "text-amber-800",
  },
  BEBIDAS: {
    label: "Bebidas",
    emoji: "🥤",
    badge: "bg-rose-100 text-rose-700 border border-rose-200",
    header: "text-rose-700",
  },
  EMBALAGENS: {
    label: "Embalagens",
    emoji: "🥡",
    badge: "bg-violet-100 text-violet-700 border border-violet-200",
    header: "text-violet-700",
  },
  PRODUTOS_LIMPEZA: {
    label: "Produtos de Limpeza",
    emoji: "🧴",
    badge: "bg-teal-100 text-teal-700 border border-teal-200",
    header: "text-teal-700",
  },
  HORTIFRUTI: {
    label: "Hortifrúti",
    emoji: "🥬",
    badge: "bg-lime-100 text-lime-700 border border-lime-200",
    header: "text-lime-700",
  },
  MATERIAL_ESCRITORIO: {
    label: "Material de Escritório",
    emoji: "📎",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    header: "text-slate-700",
  },
};

/** Categorias com Ordem de Compra própria, fora do fluxo semanal completo —
 * cada uma tem seu próprio botão/tela dedicada, pra não pedir o mesmo item
 * duas vezes na mesma semana. */
export const LOCAIS_COM_ORDEM_PROPRIA: LocalArmazenamento[] = ["BEBIDAS", "EMBALAGENS"];

export { LocalArmazenamento };
