import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import { precisaAtualizarPreco } from "@/lib/precos";
import NovoProdutoForm from "./NovoProdutoForm";
import ProdutosListSection from "./ProdutosListSection";
import ReplicarProdutosPanel from "./ReplicarProdutosPanel";
import AjudaTela from "@/components/AjudaTela";

export default async function ProdutosPage() {
  const sessao = await requireTenant();
  const restauranteId = sessao.restauranteEfetivoId;

  const [produtos, outrasLojas, restaurante] = await Promise.all([
    prisma.produto.findMany({
      where: { restauranteId },
      orderBy: { nome: "asc" },
    }),
    sessao.isMaster
      ? prisma.restaurante.findMany({
          where: { id: { not: restauranteId } },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : Promise.resolve([]),
    prisma.restaurante.findUniqueOrThrow({
      where: { id: restauranteId },
      select: { frequenciaEstoquePadraoDias: true },
    }),
  ]);

  const precosDesatualizados = produtos.filter((p) =>
    precisaAtualizarPreco(p.precoAtualizadoEm)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Produtos</h1>
          <p className="text-stone-600 mt-1 text-sm">
            Cadastre os produtos, o local onde ficam guardados e o estoque
            regulador (mínimo) de cada um.
          </p>
        </div>
        <a
          href="/produtos/pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-stone-300 text-sm px-3 py-1.5 hover:bg-stone-50 shrink-0"
        >
          🖨️ Imprimir por categoria
        </a>
      </div>

      <AjudaTela>
        <p>
          Aqui você cadastra tudo que compra pra loja. É o primeiro passo: sem
          produto cadastrado, não tem contagem nem Ordem de Compra.
        </p>
        <p>
          Escolha o <strong>local de armazenamento</strong> de cada um (ex:
          câmara fria, estoque seco) — isso deixa a contagem bem mais rápida
          depois, porque organiza os produtos na ordem que você anda pela
          loja.
        </p>
        <p>
          O <strong>preço</strong> é obrigatório: é ele que permite ao
          sistema calcular o valor total do seu estoque a cada Ordem de
          Compra semanal, entre outras coisas. Não sabe o valor exato agora?
          Coloque uma estimativa e ajuste depois — o sistema avisa quando
          passar 30 dias sem revisar.
        </p>
        <p>
          Produto que vem em <strong>caixa fechada</strong> do fornecedor (ex:
          queijo ralado em caixa de 100 unidades)? Marque &quot;vem em
          embalagem fechada&quot; e informe o preço da caixa — o sistema
          calcula o preço por unidade sozinho e já avisa quando faltar caixa
          suficiente pra pedir.
        </p>
      </AjudaTela>

      {precosDesatualizados.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            💰 Preços desatualizados (30+ dias sem revisar)
          </p>
          <ul className="text-sm mt-1 list-disc list-inside text-amber-900">
            {precosDesatualizados.map((p) => (
              <li key={p.id}>{p.nome}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            Edite o produto e confirme o preço atual (mesmo que não tenha
            mudado) pra atualizar a data de revisão.
          </p>
        </div>
      )}

      <NovoProdutoForm
        frequenciaPadraoDias={restaurante.frequenciaEstoquePadraoDias}
      />

      <ReplicarProdutosPanel produtos={produtos} outrasLojas={outrasLojas} />

      <ProdutosListSection
        produtos={produtos}
        frequenciaPadraoDias={restaurante.frequenciaEstoquePadraoDias}
      />
    </div>
  );
}
