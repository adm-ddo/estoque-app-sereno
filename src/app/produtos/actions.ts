"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import { LocalArmazenamento, LOCAIS_ORDEM } from "@/lib/locais";
import { UNIDADES } from "@/lib/unidades";
import {
  encontrarSimilares,
  normalizarNome,
  type ProdutoComparavel,
} from "@/lib/similaridade";
import { revalidatePath } from "next/cache";

function parseLocal(formData: FormData): LocalArmazenamento {
  const raw = String(formData.get("local") ?? "");
  if ((LOCAIS_ORDEM as string[]).includes(raw)) {
    return raw as LocalArmazenamento;
  }
  return "ESTOQUE_SECO";
}

function parseUnidade(formData: FormData): string {
  const raw = String(formData.get("unidade") ?? "");
  return (UNIDADES as readonly string[]).includes(raw) ? raw : "UN";
}

/** Campos monetários/numéricos opcionais: em branco = não informado. */
function parseNumeroOpcional(formData: FormData, campo: string): number | null {
  const raw = String(formData.get(campo) ?? "").trim();
  if (!raw) return null;
  const valor = Number(raw);
  return Number.isNaN(valor) ? null : valor;
}

function parseTextoOpcional(formData: FormData, campo: string): string | null {
  const raw = String(formData.get(campo) ?? "").trim();
  return raw || null;
}

function parseCheckbox(formData: FormData, campo: string): boolean {
  return formData.get(campo) === "on" || formData.get(campo) === "true";
}

/** Preço por unidade: se vier embalagem fechada (rótulo + quantidade dentro
 * + preço da embalagem) todos preenchidos, o preço por unidade é sempre
 * recalculado no servidor a partir deles — nunca confia só no valor
 * derivado que o cliente já mandou. Sem embalagem, usa o preço direto. */
function parseInfoPreco(formData: FormData): {
  preco: number | null;
  unidadeCompraLabel: string | null;
  unidadeCompraQuantidade: number | null;
  precoCompra: number | null;
  observacaoCompra: string | null;
} {
  const unidadeCompraLabel = parseTextoOpcional(formData, "unidadeCompraLabel");
  const unidadeCompraQuantidade = parseNumeroOpcional(formData, "unidadeCompraQuantidade");
  const precoCompra = parseNumeroOpcional(formData, "precoCompra");

  const temEmbalagem =
    unidadeCompraLabel !== null &&
    unidadeCompraQuantidade !== null &&
    unidadeCompraQuantidade > 0 &&
    precoCompra !== null;

  return {
    preco: temEmbalagem
      ? precoCompra! / unidadeCompraQuantidade!
      : parseNumeroOpcional(formData, "preco"),
    unidadeCompraLabel: temEmbalagem ? unidadeCompraLabel : null,
    unidadeCompraQuantidade: temEmbalagem ? unidadeCompraQuantidade : null,
    precoCompra: temEmbalagem ? precoCompra : null,
    observacaoCompra: temEmbalagem ? parseTextoOpcional(formData, "observacaoCompra") : null,
  };
}

export async function checkProdutoSimilar(
  nome: string
): Promise<ProdutoComparavel[]> {
  const sessao = await requireTenant();
  const nomeTrim = nome.trim();
  if (!nomeTrim) return [];

  const existentes = await prisma.produto.findMany({
    where: { restauranteId: sessao.restauranteEfetivoId },
    select: { id: true, nome: true, unidade: true },
  });
  return encontrarSimilares(nomeTrim, existentes);
}

export async function createProduto(formData: FormData) {
  const sessao = await requireTenant();
  const nome = String(formData.get("nome") ?? "").trim();
  const unidade = parseUnidade(formData);
  const estoqueRegulador = Number(formData.get("estoqueRegulador") ?? 0);
  const frequenciaEstoqueDias = parseNumeroOpcional(formData, "frequenciaEstoqueDias");
  const local = parseLocal(formData);
  const pedidoDireto = parseCheckbox(formData, "pedidoDireto");
  const pedidoMinimo = parseNumeroOpcional(formData, "pedidoMinimo");
  const pedidoRapido = parseCheckbox(formData, "pedidoRapido");
  const infoPreco = parseInfoPreco(formData);
  const confirmarDuplicado = formData.get("confirmarDuplicado") === "true";

  if (!nome) {
    throw new Error("Nome do produto é obrigatório");
  }
  if (infoPreco.preco === null) {
    throw new Error("Preço é obrigatório");
  }

  if (!confirmarDuplicado) {
    const similares = await checkProdutoSimilar(nome);
    if (similares.length > 0) {
      // Defesa em profundidade: a UI normal já mostra o diálogo antes de
      // chegar aqui. Isso só é alcançado num POST direto contornando a UI.
      throw new Error("DUPLICADO_NAO_CONFIRMADO");
    }
  }

  await prisma.produto.create({
    data: {
      nome,
      unidade,
      estoqueRegulador,
      frequenciaEstoqueDias,
      local,
      pedidoDireto,
      pedidoMinimo,
      pedidoRapido,
      restauranteId: sessao.restauranteEfetivoId,
      unidadeCompraLabel: infoPreco.unidadeCompraLabel,
      unidadeCompraQuantidade: infoPreco.unidadeCompraQuantidade,
      precoCompra: infoPreco.precoCompra,
      observacaoCompra: infoPreco.observacaoCompra,
      preco: infoPreco.preco,
      precoAtualizadoEm: new Date(),
      historicoPrecos: { create: { preco: infoPreco.preco } },
    },
  });

  revalidatePath("/produtos");
}

export async function updateProduto(id: number, formData: FormData) {
  const sessao = await requireTenant();
  const nome = String(formData.get("nome") ?? "").trim();
  const unidade = parseUnidade(formData);
  const estoqueRegulador = Number(formData.get("estoqueRegulador") ?? 0);
  const frequenciaEstoqueDias = parseNumeroOpcional(formData, "frequenciaEstoqueDias");
  const local = parseLocal(formData);
  const pedidoDireto = parseCheckbox(formData, "pedidoDireto");
  const pedidoMinimo = parseNumeroOpcional(formData, "pedidoMinimo");
  const pedidoRapido = parseCheckbox(formData, "pedidoRapido");
  const infoPreco = parseInfoPreco(formData);

  if (!nome) {
    throw new Error("Nome do produto é obrigatório");
  }
  if (infoPreco.preco === null) {
    throw new Error("Preço é obrigatório");
  }

  const existente = await prisma.produto.findFirst({
    where: { id, restauranteId: sessao.restauranteEfetivoId },
    select: { preco: true },
  });
  if (!existente) throw new Error("Produto não encontrado");

  // Preço registra uma nova linha de histórico só quando o valor muda, mas
  // sempre "reseta o relógio" do lembrete quando confirmado de novo.
  const precoMudou = infoPreco.preco !== existente.preco;

  await prisma.produto.update({
    where: { id },
    data: {
      nome,
      unidade,
      estoqueRegulador,
      frequenciaEstoqueDias,
      local,
      pedidoDireto,
      pedidoMinimo,
      pedidoRapido,
      preco: infoPreco.preco,
      unidadeCompraLabel: infoPreco.unidadeCompraLabel,
      unidadeCompraQuantidade: infoPreco.unidadeCompraQuantidade,
      precoCompra: infoPreco.precoCompra,
      observacaoCompra: infoPreco.observacaoCompra,
      precoAtualizadoEm: new Date(),
      ...(precoMudou ? { historicoPrecos: { create: { preco: infoPreco.preco } } } : {}),
    },
  });

  revalidatePath("/produtos");
}

export async function deleteProduto(id: number) {
  const sessao = await requireTenant();
  await prisma.produto.deleteMany({
    where: { id, restauranteId: sessao.restauranteEfetivoId },
  });
  revalidatePath("/produtos");
}

/** Só o login master pode replicar: copia produtos da loja atual pra outra,
 * individualmente, por categoria (local) ou todos de uma vez. Reaproveita
 * produtos já existentes no destino com o mesmo nome (normalizado) em vez de
 * duplicar — não sobrescreve nada que já exista lá. Não altera a loja de
 * origem. */
export async function replicarProdutos(
  formData: FormData
): Promise<{ ok: true; criados: number; jaExistiam: number } | { erro: string }> {
  const sessao = await requireTenant();
  if (!sessao.isMaster) return { erro: "Só o login master pode replicar." };

  const restauranteDestinoId = Number(formData.get("restauranteDestinoId") ?? NaN);
  if (Number.isNaN(restauranteDestinoId)) {
    return { erro: "Escolha a loja de destino." };
  }
  if (restauranteDestinoId === sessao.restauranteEfetivoId) {
    return { erro: "Escolha uma loja diferente da loja de origem." };
  }

  const destino = await prisma.restaurante.findUnique({
    where: { id: restauranteDestinoId },
    select: { id: true },
  });
  if (!destino) return { erro: "Loja de destino não encontrada." };

  const modo = String(formData.get("modo") ?? "");
  const where: {
    restauranteId: number;
    id?: number | { in: number[] };
    local?: LocalArmazenamento | { in: LocalArmazenamento[] };
  } = {
    restauranteId: sessao.restauranteEfetivoId,
  };

  if (modo === "selecionados") {
    const produtoIds = formData
      .getAll("produtoIds")
      .map((v) => Number(v))
      .filter((v) => !Number.isNaN(v));
    if (produtoIds.length === 0) return { erro: "Escolha pelo menos um produto." };
    where.id = { in: produtoIds };
  } else if (modo === "categorias") {
    const locais = formData
      .getAll("locais")
      .map((v) => String(v))
      .filter((v) => (LOCAIS_ORDEM as string[]).includes(v));
    if (locais.length === 0) {
      return { erro: "Escolha pelo menos uma categoria." };
    }
    where.local = { in: locais as LocalArmazenamento[] };
  } else if (modo !== "todos") {
    return { erro: "Modo de replicação inválido." };
  }

  const produtosOrigem = await prisma.produto.findMany({ where });
  if (produtosOrigem.length === 0) {
    return { erro: "Nenhum produto encontrado pra replicar." };
  }

  const produtosDestino = await prisma.produto.findMany({
    where: { restauranteId: restauranteDestinoId },
    select: { nome: true },
  });
  const nomesExistentes = new Set(
    produtosDestino.map((p) => normalizarNome(p.nome))
  );

  let criados = 0;
  let jaExistiam = 0;

  await prisma.$transaction(async (tx) => {
    for (const produto of produtosOrigem) {
      const nomeNormalizado = normalizarNome(produto.nome);
      if (nomesExistentes.has(nomeNormalizado)) {
        jaExistiam++;
        continue;
      }
      await tx.produto.create({
        data: {
          nome: produto.nome,
          unidade: produto.unidade,
          local: produto.local,
          estoqueRegulador: produto.estoqueRegulador,
          frequenciaEstoqueDias: produto.frequenciaEstoqueDias,
          pedidoDireto: produto.pedidoDireto,
          pedidoMinimo: produto.pedidoMinimo,
          pedidoRapido: produto.pedidoRapido,
          restauranteId: restauranteDestinoId,
          unidadeCompraLabel: produto.unidadeCompraLabel,
          unidadeCompraQuantidade: produto.unidadeCompraQuantidade,
          precoCompra: produto.precoCompra,
          observacaoCompra: produto.observacaoCompra,
          ...(produto.preco !== null
            ? {
                preco: produto.preco,
                precoAtualizadoEm: new Date(),
                historicoPrecos: { create: { preco: produto.preco } },
              }
            : {}),
        },
      });
      nomesExistentes.add(nomeNormalizado);
      criados++;
    }
  });

  revalidatePath("/produtos");
  return { ok: true, criados, jaExistiam };
}
