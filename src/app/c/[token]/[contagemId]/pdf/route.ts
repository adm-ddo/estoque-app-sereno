import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterPdfContagem } from "@/lib/lista-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; contagemId: string }> }
) {
  const { token, contagemId: contagemIdStr } = await params;
  const contagemId = Number(contagemIdStr);
  if (Number.isNaN(contagemId)) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const restaurante = await prisma.restaurante.findUnique({
    where: { tokenContagem: token },
    select: { id: true },
  });
  if (!restaurante) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const resultado = await obterPdfContagem(contagemId, restaurante.id);
  if (!resultado) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const dataArquivo = resultado.data.toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(resultado.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lista-compras-${dataArquivo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
