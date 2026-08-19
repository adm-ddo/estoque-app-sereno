"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { requireTenant } from "@/lib/auth";
import {
  encontrarFornecedoresDuplicados,
  type FornecedorComparavel,
} from "@/lib/documentos";
import { revalidatePath } from "next/cache";

function parseProdutoIds(formData: FormData): number[] {
  return formData
    .getAll("produtoIds")
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v));
}

async function produtoIdsValidos(
  produtoIdsBrutos: number[],
  restauranteId: number
): Promise<number[]> {
  if (produtoIdsBrutos.length === 0) return [];
  const validos = await prisma.produto.findMany({
    where: { id: { in: produtoIdsBrutos }, restauranteId },
    select: { id: true },
  });
  return validos.map((p) => p.id);
}

export async function checkFornecedorDuplicado(
  documento: string,
  telefone: string
): Promise<FornecedorComparavel[]> {
  const sessao = await requireTenant();
  const existentes = await prisma.fornecedor.findMany({
    where: { restauranteId: sessao.restauranteEfetivoId },
    select: { id: true, nome: true, documento: true, telefone: true },
  });
  return encontrarFornecedoresDuplicados(documento, telefone, existentes);
}

export async function createFornecedor(formData: FormData) {
  const sessao = await requireTenant();
  const nome = String(formData.get("nome") ?? "").trim();
  const documento = String(formData.get("documento") ?? "").trim();
  const contatoNome = String(formData.get("contatoNome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const modo = String(formData.get("modo") ?? "novo");
  const substituirId = Number(formData.get("substituirId") ?? NaN);
  const produtoIdsBrutos = parseProdutoIds(formData);

  if (!nome) throw new Error("Nome do fornecedor é obrigatório");
  if (!documento) throw new Error("CNPJ ou CPF do fornecedor é obrigatório");

  const produtoIds = await produtoIdsValidos(
    produtoIdsBrutos,
    sessao.restauranteEfetivoId
  );

  if (modo !== "duplicar") {
    const duplicados = await checkFornecedorDuplicado(documento, telefone);
    if (duplicados.length > 0 && modo !== "substituir") {
      // Defesa em profundidade: a UI normal já mostra o diálogo antes de
      // chegar aqui.
      throw new Error("DUPLICADO_NAO_CONFIRMADO");
    }
  }

  if (modo === "substituir") {
    if (Number.isNaN(substituirId)) {
      throw new Error("Fornecedor a substituir não informado");
    }
    const alvo = await prisma.fornecedor.findFirst({
      where: { id: substituirId, restauranteId: sessao.restauranteEfetivoId },
      include: { produtos: true },
    });
    if (!alvo) throw new Error("Fornecedor não encontrado");

    const idsExistentes = new Set(alvo.produtos.map((p) => p.produtoId));
    const idsParaAdicionar = produtoIds.filter((id) => !idsExistentes.has(id));

    await prisma.$transaction([
      prisma.fornecedor.update({
        where: { id: alvo.id },
        data: {
          nome,
          documento,
          contatoNome: contatoNome || null,
          telefone: telefone || null,
        },
      }),
      ...(idsParaAdicionar.length > 0
        ? [
            prisma.produtoFornecedor.createMany({
              data: idsParaAdicionar.map((produtoId) => ({
                produtoId,
                fornecedorId: alvo.id,
              })),
            }),
          ]
        : []),
    ]);

    revalidatePath("/fornecedores");
    return;
  }

  await prisma.fornecedor.create({
    data: {
      nome,
      documento,
      contatoNome: contatoNome || null,
      telefone: telefone || null,
      restauranteId: sessao.restauranteEfetivoId,
      produtos: {
        create: produtoIds.map((produtoId) => ({ produtoId })),
      },
    },
  });

  revalidatePath("/fornecedores");
}

export async function updateFornecedor(id: number, formData: FormData) {
  const sessao = await requireTenant();
  const nome = String(formData.get("nome") ?? "").trim();
  const documento = String(formData.get("documento") ?? "").trim();
  const contatoNome = String(formData.get("contatoNome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const produtoIdsBrutos = parseProdutoIds(formData);

  if (!nome) throw new Error("Nome do fornecedor é obrigatório");
  if (!documento) throw new Error("CNPJ ou CPF do fornecedor é obrigatório");

  const produtoIds = await produtoIdsValidos(
    produtoIdsBrutos,
    sessao.restauranteEfetivoId
  );

  const alvo = await prisma.fornecedor.findFirst({
    where: { id, restauranteId: sessao.restauranteEfetivoId },
  });
  if (!alvo) throw new Error("Fornecedor não encontrado");

  await prisma.$transaction([
    prisma.produtoFornecedor.deleteMany({ where: { fornecedorId: id } }),
    prisma.fornecedor.update({
      where: { id },
      data: {
        nome,
        documento,
        contatoNome: contatoNome || null,
        telefone: telefone || null,
        produtos: {
          create: produtoIds.map((produtoId) => ({ produtoId })),
        },
      },
    }),
  ]);

  revalidatePath("/fornecedores");
}

export async function deleteFornecedor(id: number) {
  const sessao = await requireTenant();
  await prisma.fornecedor.deleteMany({
    where: { id, restauranteId: sessao.restauranteEfetivoId },
  });
  revalidatePath("/fornecedores");
}

type FornecedorParaReplicar = {
  nome: string;
  documento: string;
  contatoNome: string | null;
  telefone: string | null;
};

/** Copia só o cadastro do fornecedor (nome, documento, contato, telefone)
 * pra outra loja — NÃO replica os produtos vinculados a ele na origem, já
 * que cada loja vende um sortimento diferente (ex: o fornecedor da loja A
 * pode vender itens que a loja B nem cadastra). Quem usa vincula os
 * produtos certos do destino depois, editando o fornecedor já replicado. */
async function replicarUmFornecedor(
  tx: Prisma.TransactionClient,
  origem: FornecedorParaReplicar,
  restauranteDestinoId: number
) {
  await tx.fornecedor.create({
    data: {
      nome: origem.nome,
      documento: origem.documento,
      contatoNome: origem.contatoNome,
      telefone: origem.telefone,
      restauranteId: restauranteDestinoId,
    },
  });
}

/** Só o login master pode replicar: copia o cadastro dos fornecedores
 * selecionados (nome, documento, contato, telefone) de uma loja pra outra,
 * sem nenhum produto vinculado — não faz sentido herdar os produtos da
 * origem, já que cada loja vende coisas diferentes. Não altera nada na
 * loja de origem. */
export async function replicarFornecedoresSelecionados(
  formData: FormData
): Promise<{ ok: true; quantidade: number } | { erro: string }> {
  const sessao = await requireTenant();
  if (!sessao.isMaster) return { erro: "Só o login master pode replicar." };

  const restauranteDestinoId = Number(formData.get("restauranteDestinoId") ?? NaN);
  if (Number.isNaN(restauranteDestinoId)) {
    return { erro: "Escolha a loja de destino." };
  }
  if (restauranteDestinoId === sessao.restauranteEfetivoId) {
    return { erro: "Escolha uma loja diferente da loja de origem." };
  }

  const fornecedorIds = formData
    .getAll("fornecedorIds")
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v));
  if (fornecedorIds.length === 0) {
    return { erro: "Selecione pelo menos um fornecedor." };
  }

  const destino = await prisma.restaurante.findUnique({
    where: { id: restauranteDestinoId },
    select: { id: true },
  });
  if (!destino) return { erro: "Loja de destino não encontrada." };

  const fornecedores = await prisma.fornecedor.findMany({
    where: { id: { in: fornecedorIds }, restauranteId: sessao.restauranteEfetivoId },
  });
  if (fornecedores.length === 0) {
    return { erro: "Nenhum fornecedor válido selecionado." };
  }

  await prisma.$transaction(async (tx) => {
    for (const fornecedor of fornecedores) {
      await replicarUmFornecedor(tx, fornecedor, restauranteDestinoId);
    }
  });

  revalidatePath("/fornecedores");
  return { ok: true, quantidade: fornecedores.length };
}
