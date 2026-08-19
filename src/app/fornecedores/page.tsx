import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import FornecedorCreateForm from "./FornecedorCreateForm";
import FornecedorRow from "./FornecedorRow";
import ReplicarFornecedoresPanel from "./ReplicarFornecedoresPanel";
import VerificacaoFornecedoresPanel from "./VerificacaoFornecedoresPanel";
import AjudaTela from "@/components/AjudaTela";

export default async function FornecedoresPage() {
  const sessao = await requireTenant();
  const restauranteId = sessao.restauranteEfetivoId;

  const [fornecedores, produtos, outrasLojas] = await Promise.all([
    prisma.fornecedor.findMany({
      where: { restauranteId },
      orderBy: { nome: "asc" },
      include: { produtos: { include: { produto: true } } },
    }),
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
  ]);

  const fornecedoresPorProduto = new Map<number, string[]>();
  for (const fornecedor of fornecedores) {
    for (const vinculo of fornecedor.produtos) {
      const lista = fornecedoresPorProduto.get(vinculo.produtoId) ?? [];
      lista.push(fornecedor.nome);
      fornecedoresPorProduto.set(vinculo.produtoId, lista);
    }
  }
  const produtosSemFornecedor = produtos
    .filter((p) => !fornecedoresPorProduto.has(p.id))
    .map((p) => ({ id: p.id, nome: p.nome, local: p.local }));
  const produtosComMultiplosFornecedores = produtos
    .filter((p) => (fornecedoresPorProduto.get(p.id)?.length ?? 0) > 1)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      local: p.local,
      fornecedores: fornecedoresPorProduto.get(p.id)!,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Fornecedores
        </h1>
        <p className="text-stone-600 mt-1 text-sm">
          Cadastre os fornecedores e marque quais produtos cada um vende.
        </p>
      </div>

      <AjudaTela>
        <p>
          Cadastre aqui cada fornecedor que você trabalha e marque quais
          produtos ele vende. É isso que faz a Ordem de Compra se separar
          sozinha por fornecedor na hora de mandar pro WhatsApp.
        </p>
        <p>
          Os produtos aparecem agrupados por <strong>local</strong>, igual na
          tela de Produtos — assim fica fácil ir direto no que interessa. Se
          um fornecedor só vende embalagens, por exemplo, é só olhar o grupo
          &quot;Embalagens&quot; e marcar tudo de uma vez.
        </p>
      </AjudaTela>

      <FornecedorCreateForm produtos={produtos} />

      <ReplicarFornecedoresPanel
        outrasLojas={outrasLojas}
        fornecedores={fornecedores.map((f) => ({ id: f.id, nome: f.nome }))}
      />

      <VerificacaoFornecedoresPanel
        produtosSemFornecedor={produtosSemFornecedor}
        produtosComMultiplosFornecedores={produtosComMultiplosFornecedores}
      />

      <ul className="flex flex-col gap-3">
        {fornecedores.map((fornecedor) => (
          <FornecedorRow
            key={fornecedor.id}
            fornecedor={fornecedor}
            produtos={produtos}
          />
        ))}
        {fornecedores.length === 0 && (
          <p className="text-stone-500 text-sm">
            Nenhum fornecedor cadastrado ainda.
          </p>
        )}
      </ul>
    </div>
  );
}
