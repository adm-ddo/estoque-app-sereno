"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSessao, SESSAO_COOKIE } from "@/lib/auth";
import {
  lerDadosRestaurante,
  gerarTokenContagem,
  type DadosRestauranteState,
} from "@/lib/restaurante";

export async function selecionarEmpresa(restauranteId: number) {
  const sessao = await requireSessao();

  // Checagem de posse: só pode selecionar uma empresa que realmente é sua.
  const vinculo = await prisma.usuarioRestaurante.findUnique({
    where: {
      usuarioId_restauranteId: {
        usuarioId: sessao.usuarioId,
        restauranteId,
      },
    },
  });
  if (!vinculo) {
    throw new Error("Essa empresa não pertence a este login.");
  }

  const token = (await cookies()).get(SESSAO_COOKIE)?.value;
  if (!token) redirect("/login");

  await prisma.sessao.update({
    where: { token },
    data: { restauranteAtivoId: restauranteId },
  });
  revalidatePath("/", "layout");
  redirect("/produtos");
}

export type NovaEmpresaState = DadosRestauranteState;

export async function cadastrarNovaEmpresa(
  _prev: NovaEmpresaState,
  formData: FormData
): Promise<NovaEmpresaState> {
  const sessao = await requireSessao();

  const resultado = await lerDadosRestaurante(formData);
  if ("erro" in resultado) return resultado;

  const restaurante = await prisma.$transaction(async (tx) => {
    const novoRestaurante = await tx.restaurante.create({
      data: { ...resultado.dados, tokenContagem: gerarTokenContagem() },
    });
    await tx.usuarioRestaurante.create({
      data: { usuarioId: sessao.usuarioId, restauranteId: novoRestaurante.id },
    });
    return novoRestaurante;
  });

  const token = (await cookies()).get(SESSAO_COOKIE)?.value;
  if (token) {
    await prisma.sessao.update({
      where: { token },
      data: { restauranteAtivoId: restaurante.id },
    });
  }

  revalidatePath("/", "layout");
  redirect("/produtos");
}

export async function removerEmpresa(restauranteId: number) {
  const sessao = await requireSessao();

  await prisma.usuarioRestaurante.deleteMany({
    where: { usuarioId: sessao.usuarioId, restauranteId },
  });

  // Se a empresa removida era a ativa nesta sessão, limpa a seleção.
  if (sessao.restauranteAtivoId === restauranteId) {
    const token = (await cookies()).get(SESSAO_COOKIE)?.value;
    if (token) {
      await prisma.sessao.update({
        where: { token },
        data: { restauranteAtivoId: null },
      });
    }
  }

  revalidatePath("/empresas");
  revalidatePath("/", "layout");
}

/** Apaga o restaurante de verdade (produtos, fornecedores, contagens — tudo
 * junto, via cascata do schema). Diferente de removerEmpresa, que só tira o
 * vínculo deste login sem mexer nos dados. */
export async function excluirRestaurante(restauranteId: number) {
  const sessao = await requireSessao();

  // Checagem de posse: só quem tem vínculo com essa empresa pode apagar.
  const vinculo = await prisma.usuarioRestaurante.findUnique({
    where: {
      usuarioId_restauranteId: {
        usuarioId: sessao.usuarioId,
        restauranteId,
      },
    },
  });
  if (!vinculo) {
    throw new Error("Essa empresa não pertence a este login.");
  }

  await prisma.restaurante.delete({ where: { id: restauranteId } });

  revalidatePath("/empresas");
  revalidatePath("/", "layout");
}
