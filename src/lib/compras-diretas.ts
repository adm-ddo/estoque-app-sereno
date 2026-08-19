import "server-only";
import { prisma } from "@/lib/prisma";

/** Pedido direto (produtos sem estoque regulador confiável, de qualquer
 * categoria — Hortifrúti, Bebidas, etc) não usa cálculo de déficit — cada
 * pedido já é a quantidade exata que a pessoa decidiu comprar. Por isso o
 * valor comprado é só somar quantidade × preço de cada item pedido no
 * período, em vez de estimar consumo como faz pros outros produtos. */
export async function calcularComprasDiretas(
  restauranteId: number,
  desde: Date,
  ate?: Date
): Promise<number> {
  const itens = await prisma.contagemItem.findMany({
    where: {
      produto: { pedidoDireto: true },
      contagem: {
        restauranteId,
        data: { gte: desde, ...(ate ? { lt: ate } : {}) },
      },
    },
    select: { quantidadeContada: true, produto: { select: { preco: true } } },
  });

  return itens.reduce(
    (soma, item) => soma + item.quantidadeContada * (item.produto.preco ?? 0),
    0
  );
}
