import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import {
  montarListaCompras,
  montarMensagemCompleta,
  montarLinkWhatsAppDireto,
} from "@/lib/pedidos";
import { analisarProduto, type AnaliseProduto } from "@/lib/analise-consumo";
import { calcularValorEstoque, calcularCmvSemana } from "@/lib/cmv";
import { calcularComprasDiretas } from "@/lib/compras-diretas";
import { inicioDaSemanaBrasil } from "@/lib/data";
import { LOCAIS_COM_ORDEM_PROPRIA, LOCAL_INFO } from "@/lib/locais";
import ListaComprasView, {
  type ResponsavelCompras,
} from "@/components/ListaComprasView";
import ResumoFinanceiro from "@/components/ResumoFinanceiro";
import BotaoExcluirContagem from "./BotaoExcluirContagem";

export default async function ResultadoContagemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await requireTenant();
  const { id } = await params;
  const contagemId = Number(id);
  if (Number.isNaN(contagemId)) notFound();

  const [contagem, restaurante] = await Promise.all([
    prisma.contagem.findFirst({
      where: { id: contagemId, restauranteId: sessao.restauranteEfetivoId },
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
    }),
    prisma.restaurante.findUnique({
      where: { id: sessao.restauranteEfetivoId },
      select: {
        responsavelComprasNome: true,
        responsavelComprasTelefone: true,
        responsavelComprasNome2: true,
        responsavelComprasTelefone2: true,
      },
    }),
  ]);

  if (!contagem) notFound();

  // O campo `local` é a fonte confiável de escopo (nulo = contagem completa
  // da loja ou Pedido Rápido, ver `pedidoRapido`). Contagens de antes desse
  // campo existir também ficam com `local` nulo por padrão — e de fato
  // eram sempre completas na época, já que a contagem escopada por
  // categoria não existia ainda.
  const pedidoRapido = contagem.pedidoRapido;
  const contagemCompleta = contagem.local === null && !pedidoRapido;
  // Fallback só pra contagens escopadas criadas antes do campo `local`
  // existir, quando ele não foi salvo.
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
            contagem: { restauranteId: sessao.restauranteEfetivoId },
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

  // Itens de pedido direto não entram no cálculo de consumo/estoque abaixo:
  // a quantidade contada neles é quanto a pessoa quer PEDIR, não quanto
  // fisicamente tem no estoque, então misturar distorceria as duas contas.
  const itensNormais = contagem.itens.filter((item) => !item.produto.pedidoDireto);

  const analises: AnaliseProduto[] = itensNormais.map((item) =>
    analisarProduto(item.produto, historicoPorProduto.get(item.produto.id) ?? [])
  );
  const alertas = analises.filter((analise) => analise.alerta);

  const valorEstoque = calcularValorEstoque(
    itensNormais.map((item) => ({
      quantidadeContada: item.quantidadeContada,
      preco: item.produto.preco,
    }))
  );
  const cmvSemana = calcularCmvSemana(
    analises.map((analise, i) => ({
      consumoUltimaSemana: analise.consumoUltimaSemana,
      preco: itensNormais[i].produto.preco,
    }))
  );
  // Produtos de pedido direto não entram no cálculo de consumo acima (a
  // quantidade contada é quanto a pessoa quer pedir, não o estoque físico)
  // — soma à parte quanto já foi pedido nesta semana, com o valor exato
  // (não estimado) de cada pedido.
  const comprasDiretoSemana = contagemCompleta
    ? await calcularComprasDiretas(
        sessao.restauranteEfetivoId,
        inicioDaSemanaBrasil(new Date())
      )
    : 0;

  // Bebidas e Embalagens saíram da contagem semanal (têm Ordem de Compra
  // própria) — pra não subestimar o "valor total em estoque", soma o valor
  // da última contagem própria de cada uma por fora.
  const valorCategoriasProprias = contagemCompleta
    ? (
        await Promise.all(
          LOCAIS_COM_ORDEM_PROPRIA.map(async (local) => {
            const ultimaContagemCategoria = await prisma.contagem.findFirst({
              where: { restauranteId: sessao.restauranteEfetivoId, local },
              orderBy: { data: "desc" },
              select: {
                itens: {
                  select: { quantidadeContada: true, produto: { select: { preco: true } } },
                },
              },
            });
            if (!ultimaContagemCategoria) return null;
            const valor = calcularValorEstoque(
              ultimaContagemCategoria.itens.map((item) => ({
                quantidadeContada: item.quantidadeContada,
                preco: item.produto.preco,
              }))
            );
            return valor.valorTotal > 0
              ? { label: LOCAL_INFO[local].label, valorTotal: valor.valorTotal }
              : null;
          })
        )
      ).filter((c): c is { label: string; valorTotal: number } => c !== null)
    : [];

  const mensagemCompleta = montarMensagemCompleta(grupos, semFornecedor);
  const responsaveis: ResponsavelCompras[] = [];
  if (restaurante?.responsavelComprasTelefone) {
    responsaveis.push({
      nome: restaurante.responsavelComprasNome,
      link: montarLinkWhatsAppDireto(
        restaurante.responsavelComprasTelefone,
        mensagemCompleta
      ),
    });
  }
  if (restaurante?.responsavelComprasTelefone2) {
    responsaveis.push({
      nome: restaurante.responsavelComprasNome2,
      link: montarLinkWhatsAppDireto(
        restaurante.responsavelComprasTelefone2,
        mensagemCompleta
      ),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {contagemCompleta && (
        <ResumoFinanceiro
          valorEstoque={valorEstoque}
          cmvSemana={cmvSemana}
          comprasDiretoSemana={comprasDiretoSemana}
          valorCategoriasProprias={valorCategoriasProprias}
        />
      )}
      <ListaComprasView
        dataContagem={contagem.data}
        novaContagemHref={
          pedidoRapido
            ? "/contagem/nova?rapido=1"
            : localEscopo
              ? `/contagem/nova?local=${localEscopo}`
              : "/contagem/nova"
        }
        pdfHref={`/contagem/${contagem.id}/pdf`}
        tituloEscopo={tituloEscopo}
        grupos={grupos}
        semFornecedor={semFornecedor}
        alertas={alertas}
        responsaveis={responsaveis}
      />
      {sessao.isMaster && <BotaoExcluirContagem contagemId={contagem.id} />}
    </div>
  );
}
