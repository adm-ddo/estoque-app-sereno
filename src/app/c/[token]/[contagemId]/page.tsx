import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  montarListaCompras,
  montarMensagemCompleta,
  montarLinkWhatsAppDireto,
} from "@/lib/pedidos";
import { analisarProduto, type AnaliseProduto } from "@/lib/analise-consumo";
import { LOCAL_INFO } from "@/lib/locais";
import ListaComprasView, {
  type ResponsavelCompras,
} from "@/components/ListaComprasView";

export default async function ResultadoContagemPublicaPage({
  params,
}: {
  params: Promise<{ token: string; contagemId: string }>;
}) {
  const { token, contagemId: contagemIdStr } = await params;
  const contagemId = Number(contagemIdStr);
  if (Number.isNaN(contagemId)) notFound();

  const restaurante = await prisma.restaurante.findUnique({
    where: { tokenContagem: token },
    select: {
      id: true,
      responsavelComprasNome: true,
      responsavelComprasTelefone: true,
      responsavelComprasNome2: true,
      responsavelComprasTelefone2: true,
    },
  });
  if (!restaurante) notFound();

  // Nunca confiar só no id da contagem: tem que pertencer a ESTE
  // restaurante (o do token), senão um token válido de uma loja conseguiria
  // ver a contagem de outra só adivinhando/incrementando o id.
  const contagem = await prisma.contagem.findFirst({
    where: { id: contagemId, restauranteId: restaurante.id },
    select: {
      id: true,
      data: true,
      local: true,
      pedidoRapido: true,
      itens: {
        select: {
          quantidadeContada: true,
          produto: {
            include: {
              fornecedores: { include: { fornecedor: true } },
            },
          },
        },
      },
    },
  });
  if (!contagem) notFound();

  // O campo `local` é a fonte confiável de escopo (nulo = contagem completa
  // da loja ou Pedido Rápido). Fallback só pra contagens escopadas de antes
  // desse campo existir, quando ele não foi salvo.
  const pedidoRapido = contagem.pedidoRapido;
  const contagemCompleta = contagem.local === null && !pedidoRapido;
  const locaisDaContagem = new Set(contagem.itens.map((item) => item.produto.local));
  const localEscopo =
    contagem.local ??
    (!contagemCompleta && !pedidoRapido && locaisDaContagem.size === 1
      ? [...locaisDaContagem][0]
      : null);
  const tituloEscopo = pedidoRapido
    ? "Pedido Rápido"
    : localEscopo
      ? LOCAL_INFO[localEscopo].label
      : null;

  const { grupos, semFornecedor } = montarListaCompras(contagem.itens);

  const produtoIdsDaContagem = contagem.itens.map((item) => item.produto.id);
  const historicoItens =
    produtoIdsDaContagem.length > 0
      ? await prisma.contagemItem.findMany({
          where: {
            produtoId: { in: produtoIdsDaContagem },
            contagem: { restauranteId: restaurante.id },
          },
          select: {
            produtoId: true,
            quantidadeContada: true,
            contagem: { select: { id: true, data: true } },
          },
          orderBy: { contagem: { data: "asc" } },
        })
      : [];

  const historicoPorProduto = new Map<
    number,
    { contagemId: number; data: Date; quantidadeContada: number }[]
  >();
  for (const item of historicoItens) {
    const lista = historicoPorProduto.get(item.produtoId) ?? [];
    lista.push({
      contagemId: item.contagem.id,
      data: item.contagem.data,
      quantidadeContada: item.quantidadeContada,
    });
    historicoPorProduto.set(item.produtoId, lista);
  }

  const alertas: AnaliseProduto[] = contagem.itens
    .filter((item) => !item.produto.pedidoDireto)
    .map((item) =>
      analisarProduto(item.produto, historicoPorProduto.get(item.produto.id) ?? [])
    )
    .filter((analise) => analise.alerta);

  const mensagemCompleta = montarMensagemCompleta(grupos, semFornecedor);
  const responsaveis: ResponsavelCompras[] = [];
  if (restaurante.responsavelComprasTelefone) {
    responsaveis.push({
      nome: restaurante.responsavelComprasNome,
      link: montarLinkWhatsAppDireto(
        restaurante.responsavelComprasTelefone,
        mensagemCompleta
      ),
    });
  }
  if (restaurante.responsavelComprasTelefone2) {
    responsaveis.push({
      nome: restaurante.responsavelComprasNome2,
      link: montarLinkWhatsAppDireto(
        restaurante.responsavelComprasTelefone2,
        mensagemCompleta
      ),
    });
  }

  return (
    <ListaComprasView
      dataContagem={contagem.data}
      novaContagemHref={
        pedidoRapido
          ? `/c/${token}/nova?rapido=1`
          : localEscopo
            ? `/c/${token}/nova?local=${localEscopo}`
            : `/c/${token}/nova`
      }
      pdfHref={`/c/${token}/${contagem.id}/pdf`}
      tituloEscopo={tituloEscopo}
      grupos={grupos}
      semFornecedor={semFornecedor}
      alertas={alertas}
      responsaveis={responsaveis}
      linksInternos={false}
    />
  );
}
