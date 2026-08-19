"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import {
  criarContagemParaRestaurante,
  atualizarContagemParaRestaurante,
} from "@/lib/contagem";
import type { LocalArmazenamento } from "@/lib/locais";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createContagem(
  local: LocalArmazenamento | null,
  pedidoRapido: boolean | undefined,
  formData: FormData
) {
  const sessao = await requireTenant();
  const contagemId = await criarContagemParaRestaurante(
    sessao.restauranteEfetivoId,
    formData,
    local,
    pedidoRapido
  );
  redirect(`/contagem/${contagemId}`);
}

export async function updateContagem(
  contagemId: number,
  local: LocalArmazenamento | null,
  pedidoRapido: boolean | undefined,
  formData: FormData
) {
  const sessao = await requireTenant();
  await atualizarContagemParaRestaurante(
    contagemId,
    sessao.restauranteEfetivoId,
    formData,
    local,
    pedidoRapido
  );
  redirect(`/contagem/${contagemId}`);
}

/** Só o login master pode apagar uma Ordem de Compra — útil enquanto
 * ainda estamos testando e sobram contagens de teste/duplicadas. */
export async function excluirContagem(contagemId: number) {
  const sessao = await requireTenant();
  if (!sessao.isMaster) {
    throw new Error("Só o login master pode excluir uma Ordem de Compra.");
  }
  await prisma.contagem.deleteMany({
    where: { id: contagemId, restauranteId: sessao.restauranteEfetivoId },
  });
  revalidatePath("/contagem");
}
