export type ItemNecessidade = {
  produtoId: number;
  nome: string;
  unidade: string;
  quantidadeContada: number;
  estoqueRegulador: number;
  necessidade: number;
  unidadeCompraLabel: string | null;
  unidadeCompraQuantidade: number | null;
  observacaoCompra: string | null;
  fornecedores: { id: number; nome: string }[];
};

export type GrupoFornecedor = {
  fornecedorId: number;
  nome: string;
  itensPedido: ItemNecessidade[];
  itensOrcamento: ItemNecessidade[];
};

export type ListaCompras = {
  grupos: GrupoFornecedor[];
  semFornecedor: ItemNecessidade[];
};

type ContagemItemComProduto = {
  quantidadeContada: number;
  produto: {
    id: number;
    nome: string;
    unidade: string;
    estoqueRegulador: number;
    /** Sem estoque regulador confiável (ex: item de embalagem grande que não
     * dá pra fracionar) — a quantidade contada JÁ é a quantidade que a
     * pessoa quer pedir, sem cálculo de déficit nenhum. */
    pedidoDireto: boolean;
    unidadeCompraLabel: string | null;
    unidadeCompraQuantidade: number | null;
    observacaoCompra: string | null;
    fornecedores: {
      fornecedor: { id: number; nome: string };
    }[];
  };
};

/** Margem de tolerância: só entra na lista de compras se faltar mais que
 * isso do estoque regulador. Evita pedido por uma diferença pequena — vale
 * só pra produto SEM embalagem fechada (item solto, dá pra comprar aos
 * poucos). Produto com embalagem fechada não tem meio-termo: se não porciona
 * (balde de tomate seco, barra de queijo), qualquer falta já significa abrir
 * uma embalagem nova, então qualquer déficit conta. */
const MARGEM_TOLERANCIA_COMPRA = 0.2;

export function montarListaCompras(itens: ContagemItemComProduto[]): ListaCompras {
  const necessidades: ItemNecessidade[] = itens
    .map((item) => {
      const deficit = Math.max(
        0,
        item.produto.estoqueRegulador - item.quantidadeContada
      );
      const temEmbalagemFechada =
        item.produto.unidadeCompraLabel !== null &&
        item.produto.unidadeCompraQuantidade !== null;
      const necessidade = item.produto.pedidoDireto
        ? item.quantidadeContada
        : temEmbalagemFechada
          ? deficit
          : deficit > item.produto.estoqueRegulador * MARGEM_TOLERANCIA_COMPRA
            ? deficit
            : 0;
      return {
        produtoId: item.produto.id,
        nome: item.produto.nome,
        unidade: item.produto.unidade,
        quantidadeContada: item.quantidadeContada,
        estoqueRegulador: item.produto.estoqueRegulador,
        necessidade,
        unidadeCompraLabel: item.produto.unidadeCompraLabel,
        unidadeCompraQuantidade: item.produto.unidadeCompraQuantidade,
        observacaoCompra: item.produto.observacaoCompra,
        fornecedores: item.produto.fornecedores.map((pf) => pf.fornecedor),
      };
    })
    .filter((item) => item.necessidade > 0);

  const gruposPorFornecedor = new Map<number, GrupoFornecedor>();
  const semFornecedor: ItemNecessidade[] = [];

  for (const item of necessidades) {
    if (item.fornecedores.length === 0) {
      semFornecedor.push(item);
      continue;
    }

    const ehOrcamento = item.fornecedores.length > 1;

    for (const fornecedor of item.fornecedores) {
      let grupo = gruposPorFornecedor.get(fornecedor.id);
      if (!grupo) {
        grupo = {
          fornecedorId: fornecedor.id,
          nome: fornecedor.nome,
          itensPedido: [],
          itensOrcamento: [],
        };
        gruposPorFornecedor.set(fornecedor.id, grupo);
      }
      if (ehOrcamento) {
        grupo.itensOrcamento.push(item);
      } else {
        grupo.itensPedido.push(item);
      }
    }
  }

  return {
    grupos: Array.from(gruposPorFornecedor.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome)
    ),
    semFornecedor,
  };
}

function formatarQuantidade(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
}

/** Quando o produto vem em embalagem fechada (ex: caixa de 100), traduz a
 * necessidade em unidades de contagem pra quantas embalagens pedir,
 * arredondando pra cima — o fornecedor entende "1 caixa", não "50 UN".
 * Retorna null se o produto não tem embalagem cadastrada. */
export function sugestaoEmbalagem(
  item: Pick<ItemNecessidade, "necessidade" | "unidadeCompraLabel" | "unidadeCompraQuantidade">
): { embalagens: number; label: string } | null {
  if (!item.unidadeCompraLabel || !item.unidadeCompraQuantidade) return null;
  const embalagens = Math.ceil(item.necessidade / item.unidadeCompraQuantidade);
  const plural = embalagens === 1 ? "" : "s";
  return { embalagens, label: `${item.unidadeCompraLabel}${plural}` };
}

function formatarSugestaoEmbalagem(item: ItemNecessidade): string {
  const sugestao = sugestaoEmbalagem(item);
  return sugestao ? ` (≈ ${sugestao.embalagens} ${sugestao.label})` : "";
}

/** Como o produto é vendido pelo fornecedor (ex: "Fardo com 12 UN") —
 * mostrado junto ao nome pra quem recebe o pedido saber de cara o formato,
 * sem precisar que isso esteja escrito no nome do produto. Retorna null
 * pra produto sem embalagem fechada cadastrada. */
export function descricaoEmbalagem(
  item: Pick<ItemNecessidade, "unidadeCompraLabel" | "unidadeCompraQuantidade" | "unidade">
): string | null {
  if (!item.unidadeCompraLabel || !item.unidadeCompraQuantidade) return null;
  return `${item.unidadeCompraLabel} com ${formatarQuantidade(item.unidadeCompraQuantidade)} ${item.unidade}`;
}

function formatarNomeComEmbalagem(item: ItemNecessidade): string {
  const embalagem = descricaoEmbalagem(item);
  return embalagem ? `${item.nome} (${embalagem})` : item.nome;
}

function formatarLinhaItem(item: ItemNecessidade): string {
  const observacao = item.observacaoCompra ? ` — ${item.observacaoCompra}` : "";
  return `- ${formatarNomeComEmbalagem(item)}: ${formatarQuantidade(item.necessidade)} ${item.unidade}${formatarSugestaoEmbalagem(item)}${observacao}`;
}

export function montarMensagemWhatsApp(grupo: GrupoFornecedor): string {
  const linhas: string[] = [];
  linhas.push(`Olá, ${grupo.nome}! Tudo bem?`);

  if (grupo.itensPedido.length > 0) {
    linhas.push("");
    linhas.push("Gostaríamos de fazer o seguinte pedido:");
    for (const item of grupo.itensPedido) {
      linhas.push(formatarLinhaItem(item));
    }
  }

  if (grupo.itensOrcamento.length > 0) {
    linhas.push("");
    linhas.push(
      "Poderia nos enviar um orçamento para os itens abaixo, por favor?"
    );
    for (const item of grupo.itensOrcamento) {
      linhas.push(formatarLinhaItem(item));
    }
  }

  linhas.push("");
  linhas.push("Desde já agradecemos!");

  return linhas.join("\n");
}

/**
 * Link "genérico" do WhatsApp (sem destinatário fixo): abre o WhatsApp com a
 * mensagem pronta e deixa a pessoa escolher o grupo/contato na lista de
 * conversas. É o único jeito de pré-preencher texto para um GRUPO, já que
 * grupos não têm número de telefone e não existe link do tipo wa.me para
 * um grupo específico.
 */
export function montarLinkWhatsApp(mensagem: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Link do WhatsApp para um número específico (o responsável de compras tem
 * um contato conhecido, então dá pra abrir a conversa direto com ele).
 */
export function montarLinkWhatsAppDireto(
  telefone: string,
  mensagem: string
): string {
  const numeroLimpo = telefone.replace(/\D/g, "");
  return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
}

/** Mensagem única consolidando todos os fornecedores, pra mandar pro
 * responsável de compras acompanhar tudo de uma vez. */
export function montarMensagemCompleta(
  grupos: GrupoFornecedor[],
  semFornecedor: ItemNecessidade[]
): string {
  const linhas: string[] = [];
  linhas.push("Lista de compras da semana:");

  for (const grupo of grupos) {
    linhas.push("");
    linhas.push(`*${grupo.nome}*`);
    for (const item of grupo.itensPedido) {
      linhas.push(formatarLinhaItem(item));
    }
    for (const item of grupo.itensOrcamento) {
      linhas.push(`${formatarLinhaItem(item)} (solicitar orçamento)`);
    }
  }

  if (semFornecedor.length > 0) {
    linhas.push("");
    linhas.push("*Sem fornecedor cadastrado*");
    for (const item of semFornecedor) {
      linhas.push(formatarLinhaItem(item));
    }
  }

  return linhas.join("\n");
}
