"use server";

import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import {
  criarContagemParaRestaurante,
  atualizarContagemParaRestaurante,
} from "@/lib/contagem";
import type { LocalArmazenamento } from "@/lib/locais";

export async function criarContagemPublica(
  token: string,
  local: LocalArmazenamento | null,
  pedidoRapido: boolean | undefined,
  formData: FormData
) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { tokenContagem: token },
    select: { id: true },
  });
  if (!restaurante) notFound();

  const contagemId = await criarContagemParaRestaurante(
    restaurante.id,
    formData,
    local,
    pedidoRapido
  );
  redirect(`/c/${token}/${contagemId}`);
}

export async function atualizarContagemPublica(
  token: string,
  contagemId: number,
  local: LocalArmazenamento | null,
  pedidoRapido: boolean | undefined,
  formData: FormData
) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { tokenContagem: token },
    select: { id: true },
  });
  if (!restaurante) notFound();

  await atualizarContagemParaRestaurante(
    contagemId,
    restaurante.id,
    formData,
    local,
    pedidoRapido
  );
  redirect(`/c/${token}/${contagemId}`);
}
