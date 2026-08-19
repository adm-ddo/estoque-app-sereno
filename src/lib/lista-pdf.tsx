import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import {
  montarListaCompras,
  sugestaoEmbalagem,
  descricaoEmbalagem,
  type GrupoFornecedor,
  type ItemNecessidade,
} from "@/lib/pedidos";
import { formatarDataHora } from "@/lib/data";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#292524",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderBottom: "1pt solid #e7e5e4",
    paddingBottom: 12,
  },
  logo: { width: 40, height: 40, borderRadius: 6 },
  restauranteNome: { fontSize: 16, fontWeight: 700 },
  subtitulo: { fontSize: 9, color: "#78716c", marginTop: 2 },
  grupo: {
    marginBottom: 14,
    borderRadius: 4,
    border: "1pt solid #e7e5e4",
    padding: 10,
  },
  fornecedorNome: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  secaoTitulo: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#78716c",
    marginTop: 6,
    marginBottom: 3,
  },
  linhaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottom: "0.5pt solid #f5f5f4",
  },
  itemNome: { flexGrow: 1 },
  itemQtd: { fontWeight: 700 },
  avisoBox: {
    marginTop: 8,
    borderRadius: 4,
    border: "1pt solid #fcd34d",
    backgroundColor: "#fffbeb",
    padding: 10,
  },
  avisoTitulo: { fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4 },
  vazio: { fontSize: 11, color: "#57534e", marginTop: 20 },
  rodape: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#a8a29e",
    textAlign: "center",
  },
});

function formatarQuantidade(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
}

function TabelaItens({ itens }: { itens: ItemNecessidade[] }) {
  return (
    <View>
      {itens.map((item) => {
        const sugestao = sugestaoEmbalagem(item);
        const embalagem = descricaoEmbalagem(item);
        return (
          <View key={item.produtoId} style={styles.linhaItem}>
            <Text style={styles.itemNome}>
              {item.nome}
              {embalagem && ` (${embalagem})`}
            </Text>
            <Text style={styles.itemQtd}>
              {formatarQuantidade(item.necessidade)} {item.unidade}
              {sugestao && ` (~ ${sugestao.embalagens} ${sugestao.label})`}
              {item.observacaoCompra && ` — ${item.observacaoCompra}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ListaComprasDocument({
  restauranteNome,
  restauranteLogo,
  dataContagem,
  grupos,
  semFornecedor,
}: {
  restauranteNome: string;
  restauranteLogo: string | null;
  dataContagem: Date;
  grupos: GrupoFornecedor[];
  semFornecedor: ItemNecessidade[];
}) {
  const dataFormatada = formatarDataHora(dataContagem);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {restauranteLogo && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={restauranteLogo} style={styles.logo} />
          )}
          <View>
            <Text style={styles.restauranteNome}>{restauranteNome}</Text>
            <Text style={styles.subtitulo}>
              Ordem de Compra · Contagem de {dataFormatada}
            </Text>
          </View>
        </View>

        {grupos.length === 0 && semFornecedor.length === 0 && (
          <Text style={styles.vazio}>
            Nenhum item precisava ser comprado nesta contagem. Estoque em dia!
          </Text>
        )}

        {grupos.map((grupo) => (
          <View key={grupo.fornecedorId} style={styles.grupo} wrap={false}>
            <Text style={styles.fornecedorNome}>{grupo.nome}</Text>

            {grupo.itensPedido.length > 0 && (
              <View>
                <Text style={styles.secaoTitulo}>Pedido</Text>
                <TabelaItens itens={grupo.itensPedido} />
              </View>
            )}

            {grupo.itensOrcamento.length > 0 && (
              <View>
                <Text style={styles.secaoTitulo}>
                  Solicitar orçamento (mais de 1 fornecedor vende)
                </Text>
                <TabelaItens itens={grupo.itensOrcamento} />
              </View>
            )}
          </View>
        ))}

        {semFornecedor.length > 0 && (
          <View style={styles.avisoBox} wrap={false}>
            <Text style={styles.avisoTitulo}>
              Itens sem fornecedor cadastrado
            </Text>
            <TabelaItens itens={semFornecedor} />
          </View>
        )}

        <Text
          style={styles.rodape}
          render={({ pageNumber, totalPages }) =>
            `Gerado em ${formatarDataHora(new Date())} · página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export async function gerarPdfListaCompras(props: {
  restauranteNome: string;
  restauranteLogo: string | null;
  dataContagem: Date;
  grupos: GrupoFornecedor[];
  semFornecedor: ItemNecessidade[];
}): Promise<Buffer> {
  return renderToBuffer(<ListaComprasDocument {...props} />);
}

/**
 * Busca a contagem (já verificando que pertence ao restaurante informado —
 * quem chama nunca deve confiar só no id) e retorna o PDF, gerando e
 * guardando em cache (Contagem.pdfLista) na primeira vez. Retorna null se a
 * contagem não existe ou não é desse restaurante — quem chama decide como
 * responder (404, notFound(), etc).
 */
export async function obterPdfContagem(
  contagemId: number,
  restauranteId: number
): Promise<{ bytes: Buffer; data: Date } | null> {
  const contagem = await prisma.contagem.findFirst({
    where: { id: contagemId, restauranteId },
    include: {
      itens: {
        include: {
          produto: {
            include: { fornecedores: { include: { fornecedor: true } } },
          },
        },
      },
    },
  });
  if (!contagem) return null;

  if (contagem.pdfLista) {
    return { bytes: Buffer.from(contagem.pdfLista), data: contagem.data };
  }

  const restaurante = await prisma.restaurante.findUnique({
    where: { id: restauranteId },
    select: { nome: true, logo: true },
  });

  const { grupos, semFornecedor } = montarListaCompras(contagem.itens);
  const pdfBytes = await gerarPdfListaCompras({
    restauranteNome: restaurante?.nome ?? "",
    restauranteLogo: restaurante?.logo ?? null,
    dataContagem: contagem.data,
    grupos,
    semFornecedor,
  });

  await prisma.contagem.update({
    where: { id: contagem.id },
    data: { pdfLista: new Uint8Array(pdfBytes), pdfGeradoEm: new Date() },
  });

  return { bytes: pdfBytes, data: contagem.data };
}
