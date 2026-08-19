"use server";

import { prisma } from "@/lib/prisma";
import { criarSessao, hashSenha } from "@/lib/auth";
import { apenasDigitos, cpfValido } from "@/lib/documentos";
import { redirect } from "next/navigation";

export type CadastroState = { erro?: string } | undefined;

export async function cadastrarConta(
  _prev: CadastroState,
  formData: FormData
): Promise<CadastroState> {
  const nomeCompleto = String(formData.get("nomeCompleto") ?? "").trim();
  const cpfBruto = String(formData.get("cpf") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!nomeCompleto || !cpfBruto || !telefone || !email || !senha) {
    return { erro: "Preencha todos os campos." };
  }
  if (!cpfValido(cpfBruto)) {
    return { erro: "CPF inválido. Informe os 11 dígitos." };
  }
  if (senha.length < 8) {
    return { erro: "A senha deve ter pelo menos 8 caracteres." };
  }

  const cpf = apenasDigitos(cpfBruto);

  const [emailExistente, cpfExistente] = await Promise.all([
    prisma.usuario.findUnique({ where: { email } }),
    prisma.usuario.findUnique({ where: { cpf } }),
  ]);
  if (emailExistente) {
    return { erro: "Já existe uma conta com este e-mail." };
  }
  if (cpfExistente) {
    return { erro: "Já existe uma conta com este CPF." };
  }

  const senhaHash = await hashSenha(senha);

  const usuario = await prisma.usuario.create({
    data: { nomeCompleto, cpf, telefone, email, senhaHash },
  });

  await criarSessao(usuario.id);
  redirect("/empresas");
}
