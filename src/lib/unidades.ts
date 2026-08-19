export const UNIDADES = ["UN", "KG", "GR", "LT", "CX"] as const;

export type Unidade = (typeof UNIDADES)[number];
