import "server-only";
import { prisma } from "@/lib/prisma";
import { LOCAIS_ORDEM, LOCAIS_COM_ORDEM_PROPRIA, type LocalArmazenamento } from "@/lib/locais";
import { inicioDoDiaBrasil } from "@/lib/data";

/** Chave numérica estável pro escopo (restaurante + local + Pedido
 * Rápido), usada na trava de concorrência abaixo. Não precisa ser única
 * globalmente, só estável e pequena o bastante pra caber num advisory lock
 * de 2 chaves int4. Pedido Rápido usa uma faixa separada pra nunca colidir
 * com um local de verdade. */
function chaveEscopo(local?: LocalArmazenamento | null, pedidoRapido?: boolean): number {
  if (pedidoRapido) return 1000;
  if (!local) return 0;
  return LOCAIS_ORDEM.indexOf(local) + 1;
}

/** Produtos do escopo pedido: `pedidoRapido=true` pega só os produtos
 * marcados como Pedido Rápido (a tela separada, fora do ritmo semanal);
 * `local` pega uma categoria específica (sempre excluindo os de Pedido
 * Rápido, que já têm a tela deles); sem nenhum dos dois é a contagem
 * completa da loja, que exclui tanto os produtos de Pedido Rápido quanto
 * os de categorias com Ordem de Compra própria (Bebidas, Embalagens) —
 * cada uma só entra pela tela dela, pra não pedir o mesmo item duas vezes
 * na mesma semana. */
export function whereProdutosEscopo(
  restauranteId: number,
  local?: LocalArmazenamento | null,
  pedidoRapido?: boolean
) {
  if (pedidoRapido) return { restauranteId, pedidoRapido: true };
  if (local) return { restauranteId, local, pedidoRapido: false };
  return {
    restauranteId,
    pedidoRapido: false,
    local: { notIn: LOCAIS_COM_ORDEM_PROPRIA },
  };
}

/** Se a contagem mais recente do restaurante (do mesmo escopo) foi criada há
 * menos que isso e tem exatamente os mesmos itens/quantidades da que está
 * sendo enviada agora, tratamos como o mesmo envio duplicado (duplo clique,
 * reenvio por conexão lenta, etc) em vez de criar uma Ordem de Compra
 * repetida. */
const JANELA_DUPLICATA_MS = 2 * 60 * 1000;

/** Quantas horas de folga antes de sugerir "criar uma nova" em vez de
 * "editar a existente" quando já tem uma contagem do mesmo dia/escopo. */
export const LIMIAR_SUGERIR_NOVA_HORAS = 4;

type Item = { produtoId: number; quantidadeContada: number };

function mesmosItens(a: Item[], b: Item[]): boolean {
  if (a.length !== b.length) return false;
  const mapaB = new Map(b.map((item) => [item.produtoId, item.quantidadeContada]));
  return a.every((item) => mapaB.get(item.produtoId) === item.quantidadeContada);
}

export type StatusCicloProduto = {
  /** Já foi contado dentro do próprio ciclo de frequência (ex: item semanal
   * contado há 3 dias) — pode ser pulado sem preencher de novo. */
  jaContadoNoCiclo: boolean;
  ultimaContagemData: Date | null;
  frequenciaEfetivaDias: number;
};

/** Pra cada produto, olha quando foi a última vez que ele apareceu em
 * alguma contagem e compara com a frequência dele (a do produto, ou a
 * padrão da loja se ele não tiver uma própria). Se ainda está dentro do
 * ciclo, não precisa perguntar de novo hoje. Produto marcado
 * `pedidoRapido` nunca trava, independente da frequência configurada —
 * é o ponto da tela de Pedido Rápido, pedir/contar sempre que precisar.
 * `excluirContagemId` tira uma contagem específica da conta — usado ao
 * editar, pra não comparar o item com ele mesmo. */
export async function calcularStatusCiclo(
  produtos: {
    id: number;
    frequenciaEstoqueDias: number | null;
    pedidoRapido?: boolean;
  }[],
  frequenciaPadraoDias: number,
  excluirContagemId?: number | null
): Promise<Map<number, StatusCicloProduto>> {
  const produtoIds = produtos.map((p) => p.id);
  const resultado = new Map<number, StatusCicloProduto>();
  if (produtoIds.length === 0) return resultado;

  const itensRecentes = await prisma.contagemItem.findMany({
    where: {
      produtoId: { in: produtoIds },
      ...(excluirContagemId ? { contagemId: { not: excluirContagemId } } : {}),
    },
    select: { produtoId: true, contagem: { select: { data: true } } },
    orderBy: { contagem: { data: "desc" } },
  });

  const ultimaPorProduto = new Map<number, Date>();
  for (const item of itensRecentes) {
    if (!ultimaPorProduto.has(item.produtoId)) {
      ultimaPorProduto.set(item.produtoId, item.contagem.data);
    }
  }

  const agora = Date.now();
  for (const produto of produtos) {
    const frequenciaEfetivaDias = produto.frequenciaEstoqueDias ?? frequenciaPadraoDias;
    const ultimaContagemData = ultimaPorProduto.get(produto.id) ?? null;
    const diasDesde = ultimaContagemData
      ? (agora - ultimaContagemData.getTime()) / 86_400_000
      : Infinity;
    const jaContadoNoCiclo =
      !produto.pedidoRapido && frequenciaEfetivaDias > 1 && diasDesde < frequenciaEfetivaDias;
    resultado.set(produto.id, { jaContadoNoCiclo, ultimaContagemData, frequenciaEfetivaDias });
  }
  return resultado;
}

/** Lê os campos `quantidade-{produtoId}` do FormData pros produtos
 * informados. Exige que TODOS tenham uma quantidade preenchida — o campo já
 * é `required` no navegador, mas isso só protege o preenchimento normal
 * pela UI; a action é um POST alcançável direto, então valida de novo aqui.
 * Produtos com `jaContadoNoCiclo` (em statusCiclo) podem ficar sem
 * quantidade — foram pulados de propósito por já estarem dentro do ciclo. */
function validarItens(
  formData: FormData,
  produtos: { id: number; nome: string }[],
  statusCiclo?: Map<number, StatusCicloProduto>
): Item[] {
  const faltando: string[] = [];
  const itens: Item[] = [];

  for (const produto of produtos) {
    const raw = formData.get(`quantidade-${produto.id}`);
    if (raw === null || raw === "") {
      if (statusCiclo?.get(produto.id)?.jaContadoNoCiclo) {
        continue;
      }
      faltando.push(produto.nome);
      continue;
    }
    const quantidadeContada = Number(raw);
    if (Number.isNaN(quantidadeContada)) {
      faltando.push(produto.nome);
      continue;
    }
    itens.push({ produtoId: produto.id, quantidadeContada });
  }

  if (faltando.length > 0) {
    throw new Error(
      `Preencha a quantidade de todos os produtos. Faltou: ${faltando.join(", ")}.`
    );
  }

  return itens;
}

/**
 * Cria uma Contagem pro restaurante informado a partir do FormData do
 * formulário. `local` restringe aos produtos de uma categoria;
 * `pedidoRapido` pega os produtos marcados pra essa tela separada —
 * nenhum dos dois cobre a loja inteira. Produtos ainda dentro do próprio
 * ciclo de frequência (ex: item semanal contado há 2 dias) podem vir sem
 * quantidade — foram pulados de propósito, não é erro de preenchimento.
 */
export async function criarContagemParaRestaurante(
  restauranteId: number,
  formData: FormData,
  local?: LocalArmazenamento | null,
  pedidoRapido?: boolean
): Promise<number> {
  const restaurante = await prisma.restaurante.findUniqueOrThrow({
    where: { id: restauranteId },
    select: { frequenciaEstoquePadraoDias: true },
  });
  const produtos = await prisma.produto.findMany({
    where: whereProdutosEscopo(restauranteId, local, pedidoRapido),
    select: { id: true, nome: true, frequenciaEstoqueDias: true, pedidoRapido: true },
  });
  const statusCiclo = await calcularStatusCiclo(
    produtos,
    restaurante.frequenciaEstoquePadraoDias
  );

  const itens = validarItens(formData, produtos, statusCiclo);

  // Trava por restaurante+escopo: sem isso, dois envios quase simultâneos
  // (duplo clique, reenvio numa conexão lenta) podem os dois checar "existe
  // duplicata?" antes de qualquer um terminar de salvar, e os dois passam —
  // foi exatamente isso que criou contagens repetidas em produção.
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${restauranteId}, ${chaveEscopo(local, pedidoRapido)})`;

    const ultimaContagem = await tx.contagem.findFirst({
      where: { restauranteId, local: local ?? null, pedidoRapido: !!pedidoRapido },
      orderBy: { data: "desc" },
      select: {
        id: true,
        data: true,
        itens: { select: { produtoId: true, quantidadeContada: true } },
      },
    });

    const ehDuplicata =
      ultimaContagem !== null &&
      Date.now() - ultimaContagem.data.getTime() < JANELA_DUPLICATA_MS &&
      mesmosItens(itens, ultimaContagem.itens);

    if (ehDuplicata) {
      return ultimaContagem.id;
    }

    const contagem = await tx.contagem.create({
      data: {
        restauranteId,
        local: local ?? null,
        pedidoRapido: !!pedidoRapido,
        itens: { create: itens },
      },
    });

    return contagem.id;
  });
}

/**
 * Substitui os itens de uma Contagem já existente (usado quando a pessoa
 * escolhe "editar" em vez de criar uma nova, ao tentar contar de novo no
 * mesmo dia). Atualiza a data pra agora (reflete quando a contagem passou a
 * valer) e limpa o PDF em cache, já que os dados mudaram. Ao contrário de
 * criar, aqui TODOS os produtos do escopo precisam vir preenchidos — quem
 * está editando já está deliberadamente revisando essa contagem, não faz
 * sentido pular item por causa do ciclo.
 */
export async function atualizarContagemParaRestaurante(
  contagemId: number,
  restauranteId: number,
  formData: FormData,
  local?: LocalArmazenamento | null,
  pedidoRapido?: boolean
): Promise<number> {
  const contagemExistente = await prisma.contagem.findFirst({
    where: { id: contagemId, restauranteId },
    select: { id: true },
  });
  if (!contagemExistente) {
    throw new Error("Contagem não encontrada.");
  }

  const produtos = await prisma.produto.findMany({
    where: whereProdutosEscopo(restauranteId, local, pedidoRapido),
    select: { id: true, nome: true },
  });
  const itens = validarItens(formData, produtos);

  await prisma.$transaction([
    prisma.contagemItem.deleteMany({ where: { contagemId } }),
    prisma.contagem.update({
      where: { id: contagemId },
      data: {
        data: new Date(),
        local: local ?? null,
        pedidoRapido: !!pedidoRapido,
        pdfLista: null,
        pdfGeradoEm: null,
        itens: { create: itens },
      },
    }),
  ]);

  return contagemId;
}

export type ContagemDoDia = { id: number; data: Date; horasAtras: number };

/** Contagem mais recente feita hoje (fuso de Brasília) pro restaurante e
 * escopo informados — usado pra perguntar "editar essa ou criar uma nova?"
 * antes de começar uma contagem nova. */
export async function buscarContagemHojeMesmoEscopo(
  restauranteId: number,
  local?: LocalArmazenamento | null,
  pedidoRapido?: boolean
): Promise<ContagemDoDia | null> {
  const agora = new Date();
  const contagem = await prisma.contagem.findFirst({
    where: {
      restauranteId,
      local: local ?? null,
      pedidoRapido: !!pedidoRapido,
      data: { gte: inicioDoDiaBrasil(agora) },
    },
    orderBy: { data: "desc" },
    select: { id: true, data: true },
  });
  if (!contagem) return null;

  const horasAtras = (agora.getTime() - contagem.data.getTime()) / (60 * 60 * 1000);
  return { id: contagem.id, data: contagem.data, horasAtras };
}
