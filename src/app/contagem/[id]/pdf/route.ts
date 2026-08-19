import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { obterPdfContagem } from "@/lib/lista-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await requireTenant();
  const { id } = await params;
  const contagemId = Number(id);
  if (Number.isNaN(contagemId)) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const resultado = await obterPdfContagem(
    contagemId,
    sessao.restauranteEfetivoId
  );
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
