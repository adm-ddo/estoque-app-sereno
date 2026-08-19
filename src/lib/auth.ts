import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSAO_COOKIE = "sessao_token";
const SESSAO_TTL_DIAS = 30;

export type SessaoAtual = {
  usuarioId: number;
  email: string;
  isMaster: boolean;
  restauranteAtivoId: number | null;
  restauranteEfetivoId: number | null;
  restauranteEfetivoNome: string | null;
  minhasEmpresas: { id: number; nome: string }[];
};

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(
  senha: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(usuarioId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + SESSAO_TTL_DIAS * 24 * 60 * 60 * 1000);
  await prisma.sessao.create({ data: { token, usuarioId, expiraEm } });

  const cookieStore = await cookies();
  cookieStore.set(SESSAO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiraEm,
    path: "/",
  });
  // O layout raiz lê a sessão para decidir nav/faixa de demonstração; sem
  // isso o router client-side reaproveitaria o layout já em cache.
  revalidatePath("/", "layout");
}

export async function destruirSessaoAtual(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSAO_COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSAO_COOKIE);
  revalidatePath("/", "layout");
}

// Memoizado por request: várias chamadas na mesma renderização batem no
// banco só uma vez.
export const getSessao = cache(async (): Promise<SessaoAtual | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSAO_COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { token },
    select: {
      restauranteAtivoId: true,
      expiraEm: true,
      usuario: {
        select: {
          id: true,
          email: true,
          isMaster: true,
          empresas: {
            select: { restaurante: { select: { id: true, nome: true } } },
          },
        },
      },
      restauranteAtivo: { select: { nome: true } },
    },
  });
  if (!sessao || sessao.expiraEm < new Date()) return null;

  const minhasEmpresas = sessao.usuario.empresas.map((e) => e.restaurante);

  let restauranteEfetivoId: number | null;
  let restauranteEfetivoNome: string | null;

  if (sessao.usuario.isMaster) {
    restauranteEfetivoId = sessao.restauranteAtivoId;
    restauranteEfetivoNome = sessao.restauranteAtivo?.nome ?? null;
  } else if (
    sessao.restauranteAtivoId !== null &&
    minhasEmpresas.some((e) => e.id === sessao.restauranteAtivoId)
  ) {
    restauranteEfetivoId = sessao.restauranteAtivoId;
    restauranteEfetivoNome = sessao.restauranteAtivo?.nome ?? null;
  } else if (minhasEmpresas.length === 1) {
    // Só uma empresa: não faz sentido pedir escolha, seleciona direto.
    restauranteEfetivoId = minhasEmpresas[0].id;
    restauranteEfetivoNome = minhasEmpresas[0].nome;
  } else {
    // 0 ou 2+ empresas sem seleção válida: precisa escolher em /empresas.
    restauranteEfetivoId = null;
    restauranteEfetivoNome = null;
  }

  return {
    usuarioId: sessao.usuario.id,
    email: sessao.usuario.email,
    isMaster: sessao.usuario.isMaster,
    restauranteAtivoId: sessao.restauranteAtivoId,
    restauranteEfetivoId,
    restauranteEfetivoNome,
    minhasEmpresas,
  };
});

export async function requireSessao(): Promise<SessaoAtual> {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

/** Use no topo de toda page/action de produtos, fornecedores e contagem. */
export async function requireTenant(): Promise<
  SessaoAtual & { restauranteEfetivoId: number }
> {
  const sessao = await requireSessao();
  if (sessao.restauranteEfetivoId === null) {
    redirect(sessao.isMaster ? "/master" : "/empresas");
  }
  return sessao as SessaoAtual & { restauranteEfetivoId: number };
}

export async function requireMaster(): Promise<SessaoAtual> {
  const sessao = await requireSessao();
  if (!sessao.isMaster) redirect("/produtos");
  return sessao;
}
