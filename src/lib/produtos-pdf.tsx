import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { LOCAIS_ORDEM, LOCAL_INFO, type LocalArmazenamento } from "@/lib/locais";
import { formatarDataHora } from "@/lib/data";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#292524",
  },
  header: {
    marginBottom: 16,
    borderBottom: "1pt solid #e7e5e4",
    paddingBottom: 12,
  },
  restauranteNome: { fontSize: 16, fontWeight: 700 },
  subtitulo: { fontSize: 9, color: "#78716c", marginTop: 2 },
  categoria: { marginBottom: 14 },
  categoriaTitulo: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottom: "0.5pt solid #d6d3d1",
  },
  linhaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottom: "0.5pt solid #f5f5f4",
  },
  itemNome: { flexGrow: 1 },
  itemRegulador: { fontWeight: 700 },
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

export type ProdutoParaPdf = {
  nome: string;
  unidade: string;
  estoqueRegulador: number;
  local: LocalArmazenamento;
};

export function ProdutosDocument({
  restauranteNome,
  produtos,
}: {
  restauranteNome: string;
  produtos: ProdutoParaPdf[];
}) {
  const porLocal = new Map<LocalArmazenamento, ProdutoParaPdf[]>();
  for (const produto of produtos) {
    const lista = porLocal.get(produto.local) ?? [];
    lista.push(produto);
    porLocal.set(produto.local, lista);
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.restauranteNome}>{restauranteNome}</Text>
          <Text style={styles.subtitulo}>
            Relação de produtos por categoria · estoque regulador
          </Text>
        </View>

        {produtos.length === 0 && (
          <Text style={styles.vazio}>Nenhum produto cadastrado ainda.</Text>
        )}

        {LOCAIS_ORDEM.map((local) => {
          const itens = porLocal.get(local);
          if (!itens || itens.length === 0) return null;
          return (
            <View key={local} style={styles.categoria} wrap={false}>
              <Text style={styles.categoriaTitulo}>
                {LOCAL_INFO[local].label}
              </Text>
              {itens.map((item) => (
                <View key={item.nome} style={styles.linhaItem}>
                  <Text style={styles.itemNome}>{item.nome}</Text>
                  <Text style={styles.itemRegulador}>
                    {formatarQuantidade(item.estoqueRegulador)} {item.unidade}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

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

export async function gerarPdfProdutos(props: {
  restauranteNome: string;
  produtos: ProdutoParaPdf[];
}): Promise<Buffer> {
  return renderToBuffer(<ProdutosDocument {...props} />);
}
