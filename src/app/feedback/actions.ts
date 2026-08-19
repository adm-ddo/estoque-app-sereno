"use server";

import { prisma } from "@/lib/prisma";
import { requireSessao } from "@/lib/auth";
import { montarLinkWhatsAppDireto } from "@/lib/pedidos";
import { TIPOS_FEEDBACK, WHATSAPP_SUPORTE, labelTipoFeedback } from "@/lib/feedback";

export async function enviarFeedback(
  formData: FormData
): Promise<{ ok: true; linkWhatsApp: string } | { erro: string }> {
  const sessao = await requireSessao();

  const tipo = String(formData.get("tipo") ?? "");
  const mensagem = String(formData.get("mensagem") ?? "").trim();

  if (!TIPOS_FEEDBACK.some((t) => t.valor === tipo)) {
    return { erro: "Escolha o tipo da mensagem." };
  }
  if (!mensagem) {
    return { erro: "Escreva sua mensagem." };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.usuarioId },
    select: { nomeCompleto: true, telefone: true },
  });

  await prisma.feedback.create({
    data: {
      tipo,
      mensagem,
      usuarioNome: usuario?.nomeCompleto ?? null,
      usuarioEmail: sessao.email,
      usuarioTelefone: usuario?.telefone ?? null,
      restauranteNome: sessao.restauranteEfetivoNome,
    },
  });

  const mensagemWhatsApp = [
    `Nova mensagem no SERENO (${labelTipoFeedback(tipo)}):`,
    "",
    mensagem,
    "",
    `De: ${usuario?.nomeCompleto ?? sessao.email}${
      sessao.restauranteEfetivoNome ? ` · ${sessao.restauranteEfetivoNome}` : ""
    }`,
    usuario?.telefone ? `Telefone: ${usuario.telefone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const linkWhatsApp = montarLinkWhatsAppDireto(WHATSAPP_SUPORTE, mensagemWhatsApp);

  return { ok: true, linkWhatsApp };
}
