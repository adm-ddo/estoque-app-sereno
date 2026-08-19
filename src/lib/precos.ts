export const LIMIAR_DIAS_PRECO = 30;

/** Preço desatualizado = foi definido, mas não é revisado há mais de
 * LIMIAR_DIAS_PRECO dias. Produto sem preço nenhum não entra no lembrete —
 * o campo é opcional, só quem começou a rastrear preço recebe o aviso. */
export function precisaAtualizarPreco(precoAtualizadoEm: Date | null): boolean {
  if (!precoAtualizadoEm) return false;
  const diasDesdeAtualizacao =
    (Date.now() - precoAtualizadoEm.getTime()) / (1000 * 60 * 60 * 24);
  return diasDesdeAtualizacao >= LIMIAR_DIAS_PRECO;
}
