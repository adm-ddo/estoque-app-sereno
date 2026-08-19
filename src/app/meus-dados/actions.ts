"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { requireSessao, hashSenha, verificarSenha, SESSAO_COOKIE } from "@/lib/auth";
import { apenasDigitos, cpfValido } from "@/lib/documentos";
import { revalidatePath } from "next/cache";

export type MeusDadosState = { erro?: string; sucesso?: boolean } | undefined;

export async function atualizarMeusDados(
  _prev: MeusDadosState,
  formData: FormData
): Promise<MeusDadosState> {
  const sessao = await requireSessao();

  const nomeCompleto = String(formData.get("nomeCompleto") ?? "").trim();
  const cpfBruto = String(formData.get("cpf") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!nomeCompleto || !cpfBruto || !telefone || !email) {
    return { erro: "Preencha todos os campos." };
  }
  if (!cpfValido(cpfBruto)) {
    return { erro: "CPF inválido. Informe os 11 dígitos." };
  }
  const cpf = apenasDigitos(cpfBruto);

  const [emailExistente, cpfExistente] = await Promise.all([
    prisma.usuario.findUnique({ where: { email } }),
    prisma.usuario.findUnique({ where: { cpf } }),
  ]);
  if (emailExistente && emailExistente.id !== sessao.usuarioId) {
    return { erro: "Já existe uma conta com este e-mail." };
  }
  if (cpfExistente && cpfExistente.id !== sessao.usuarioId) {
    return { erro: "Já existe uma conta com este CPF." };
  }

  await prisma.usuario.update({
    where: { id: sessao.usuarioId },
    data: { nomeCompleto, cpf, telefone, email },
  });

  revalidatePath("/meus-dados");
  return { sucesso: true };
}

export type TrocarSenhaState =
  | { erro?: string; sucesso?: boolean }
  | undefined;

export async function trocarSenha(
  _prev: TrocarSenhaState,
  formData: FormData
): Promise<TrocarSenhaState> {
  const sessao = await requireSessao();

  const senhaAtual = String(formData.get("senhaAtual") ?? "");
  const novaSenha = String(formData.get("novaSenha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    return { erro: "Preencha todos os campos." };
  }
  if (novaSenha.length < 8) {
    return { erro: "A nova senha deve ter pelo menos 8 caracteres." };
  }
  if (novaSenha !== confirmarSenha) {
    return { erro: "As senhas não conferem." };
  }

  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: sessao.usuarioId },
  });
  if (!(await verificarSenha(senhaAtual, usuario.senhaHash))) {
    return { erro: "Senha atual incorreta." };
  }

  const tokenAtual = (await cookies()).get(SESSAO_COOKIE)?.value ?? "";

  const senhaHash = await hashSenha(novaSenha);
  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: sessao.usuarioId },
      data: { senhaHash },
    }),
    // Mesma cautela da recuperação por CPF: trocar a senha derruba as
    // outras sessões ativas, mas mantém a sessão atual (quem trocou não
    // precisa logar de novo na hora).
    prisma.sessao.deleteMany({
      where: { usuarioId: sessao.usuarioId, token: { not: tokenAtual } },
    }),
  ]);

  return { sucesso: true };
}
