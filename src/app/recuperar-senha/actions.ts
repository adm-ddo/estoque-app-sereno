"use server";

import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/auth";
import { apenasDigitos } from "@/lib/documentos";
import { redirect } from "next/navigation";

export type RecuperarSenhaState = { erro?: string } | undefined;

const ERRO_GENERICO = "Não encontramos uma conta com esses dados.";

export async function recuperarSenha(
  _prev: RecuperarSenhaState,
  formData: FormData
): Promise<RecuperarSenhaState> {
  const nomeCompleto = String(formData.get("nomeCompleto") ?? "").trim();
  const cpfBruto = String(formData.get("cpf") ?? "").trim();
  const novaSenha = String(formData.get("novaSenha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (!nomeCompleto || !cpfBruto || !novaSenha || !confirmarSenha) {
    return { erro: "Preencha todos os campos." };
  }
  if (novaSenha.length < 8) {
    return { erro: "A nova senha deve ter pelo menos 8 caracteres." };
  }
  if (novaSenha !== confirmarSenha) {
    return { erro: "As senhas não conferem." };
  }

  const cpf = apenasDigitos(cpfBruto);
  const usuario = await prisma.usuario.findUnique({ where: { cpf } });

  if (
    !usuario ||
    !usuario.nomeCompleto ||
    usuario.nomeCompleto.trim().toLowerCase() !== nomeCompleto.toLowerCase()
  ) {
    return { erro: ERRO_GENERICO };
  }

  const senhaHash = await hashSenha(novaSenha);
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash } }),
    // Troca de senha por recuperação: derruba todas as sessões existentes
    // daquele usuário, do mesmo jeito que "gerar novo link" invalida o
    // token antigo na hora.
    prisma.sessao.deleteMany({ where: { usuarioId: usuario.id } }),
  ]);

  redirect("/login");
}
