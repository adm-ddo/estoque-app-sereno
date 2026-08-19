"use client";

import { useState } from "react";
import { LOCAL_INFO, type LocalArmazenamento } from "@/lib/locais";

type ProdutoInfo = { id: number; nome: string; local: LocalArmazenamento };
type ProdutoComFornecedores = ProdutoInfo & { fornecedores: string[] };

export default function VerificacaoFornecedoresPanel({
  produtosSemFornecedor,
  produtosComMultiplosFornecedores,
}: {
  produtosSemFornecedor: ProdutoInfo[];
  produtosComMultiplosFornecedores: ProdutoComFornecedores[];
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="self-start rounded-lg border border-dashed border-stone-300 text-stone-600 hover:border-emerald-400 hover:text-emerald-700 text-sm px-4 py-2 transition-colors"
      >
        🔍 Verificar produtos x fornecedores
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-stone-800">
          Verificação de produtos x fornecedores
        </h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          Fechar
        </button>
      </div>

      {produtosSemFornecedor.length > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">
            ⚠️ {produtosSemFornecedor.length}{" "}
            {produtosSemFornecedor.length === 1
              ? "produto sem nenhum fornecedor vinculado"
              : "produtos sem nenhum fornecedor vinculado"}
          </p>
          <ul className="text-sm mt-1.5 list-disc list-inside text-amber-900">
            {produtosSemFornecedor.map((p) => (
              <li key={p.id}>
                {p.nome}{" "}
                <span className="text-amber-600">({LOCAL_INFO[p.local].label})</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            Sem fornecedor, esses itens não entram em nenhuma lista separada
            na Ordem de Compra — edite um fornecedor abaixo e marque esses
            produtos.
          </p>
        </div>
      ) : (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          ✅ Todos os produtos têm pelo menos um fornecedor vinculado.
        </p>
      )}

      {produtosComMultiplosFornecedores.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-sm font-medium text-sky-800">
            ℹ️ {produtosComMultiplosFornecedores.length}{" "}
            {produtosComMultiplosFornecedores.length === 1
              ? "produto vinculado a mais de um fornecedor"
              : "produtos vinculados a mais de um fornecedor"}
          </p>
          <ul className="text-sm mt-1.5 list-disc list-inside text-sky-900">
            {produtosComMultiplosFornecedores.map((p) => (
              <li key={p.id}>
                {p.nome}: {p.fornecedores.join(", ")}
              </li>
            ))}
          </ul>
          <p className="text-xs text-sky-700 mt-2">
            Normal quando mais de um fornecedor vende o mesmo item — a Ordem
            de Compra pede orçamento pros dois em vez de escolher um
            automaticamente.
          </p>
        </div>
      )}
    </div>
  );
}
