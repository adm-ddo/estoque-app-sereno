import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import { gerarPdfProdutos } from "@/lib/produtos-pdf";

export async function GET() {
  const sessao = await requireTenant();

  const [restaurante, produtos] = await Promise.all([
    prisma.restaurante.findUnique({
      where: { id: sessao.restauranteEfetivoId },
      select: { nome: true },
    }),
    prisma.produto.findMany({
      where: { restauranteId: sessao.restauranteEfetivoId },
      select: { nome: true, unidade: true, estoqueRegulador: true, local: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const pdfBytes = await gerarPdfProdutos({
    restauranteNome: restaurante?.nome ?? "",
    produtos,
  });

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="produtos-por-categoria.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
