"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { gerarTokenContagem } from "@/lib/restaurante";

export type ConfiguracoesState = { erro?: string; sucesso?: boolean } | undefined;

const MAX_LOGO_BYTES = 1_500_000; // ~1.5MB

export async function atualizarConfiguracoes(
  _prev: ConfiguracoesState,
  formData: FormData
): Promise<ConfiguracoesState> {
  const sessao = await requireTenant();

  const nome = String(formData.get("nome") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const responsavelComprasNome = String(
    formData.get("responsavelComprasNome") ?? ""
  ).trim();
  const responsavelComprasTelefone = String(
    formData.get("responsavelComprasTelefone") ?? ""
  ).trim();
  const responsavelComprasNome2 = String(
    formData.get("responsavelComprasNome2") ?? ""
  ).trim();
  const responsavelComprasTelefone2 = String(
    formData.get("responsavelComprasTelefone2") ?? ""
  ).trim();
  const frequenciaEstoquePadraoDias = Number(
    formData.get("frequenciaEstoquePadraoDias") ?? 7
  );
  const logoFile = formData.get("logo");

  if (!nome || !cnpj || !endereco) {
    return { erro: "Preencha nome, CNPJ e endereço." };
  }
  if (!Number.isInteger(frequenciaEstoquePadraoDias) || frequenciaEstoquePadraoDias <= 0) {
    return { erro: "Frequência do estoque inválida." };
  }

  let logo: string | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_BYTES) {
      return { erro: "A logo deve ter no máximo 1,5MB." };
    }
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    logo = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
  }

  await prisma.restaurante.update({
    where: { id: sessao.restauranteEfetivoId },
    data: {
      nome,
      cnpj,
      endereco,
      responsavelComprasNome: responsavelComprasNome || null,
      responsavelComprasTelefone: responsavelComprasTelefone || null,
      responsavelComprasNome2: responsavelComprasNome2 || null,
      responsavelComprasTelefone2: responsavelComprasTelefone2 || null,
      frequenciaEstoquePadraoDias,
      ...(logo ? { logo } : {}),
    },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { sucesso: true };
}

export async function regenerarTokenContagem(): Promise<{ token: string }> {
  const sessao = await requireTenant();
  const token = gerarTokenContagem();

  await prisma.restaurante.update({
    where: { id: sessao.restauranteEfetivoId },
    data: { tokenContagem: token },
  });

  revalidatePath("/configuracoes");
  return { token };
}
