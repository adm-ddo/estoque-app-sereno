"use client";

import { useState, useTransition } from "react";
import { deleteProduto } from "./actions";
import { LOCAL_INFO } from "@/lib/locais";
import { labelFrequencia } from "@/lib/frequencia";
import ProdutoEditForm, { type ProdutoParaEditar } from "./ProdutoEditForm";

/** Card — usado na lista mobile (telas < sm) em vez da tabela, pra não
 * exigir scroll horizontal pra ver preço/ações. */
export default function ProdutoCard({
  produto,
  frequenciaPadraoDias,
}: {
  produto: ProdutoParaEditar;
  frequenciaPadraoDias: number;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
        <ProdutoEditForm
          produto={produto}
          frequenciaPadraoDias={frequenciaPadraoDias}
          pending={pending}
          startTransition={startTransition}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const info = LOCAL_INFO[produto.local];

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-stone-800">{produto.nome}</p>
        <span
          className={`mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${info.badge}`}
        >
          {info.emoji} {info.label}
        </span>
        <p className="text-sm text-stone-600 mt-1.5">
          {produto.pedidoDireto ? (
            produto.pedidoMinimo != null ? (
              <>pedido direto · mínimo {produto.pedidoMinimo} {produto.unidade}</>
            ) : (
              "pedido direto, sem estoque regulador"
            )
          ) : (
            <>
              {produto.estoqueRegulador} {produto.unidade} · estoque regulador
            </>
          )}
          {produto.frequenciaEstoqueDias && (
            <span className="text-stone-400">
              {" "}
              · {labelFrequencia(produto.frequenciaEstoqueDias)}
            </span>
          )}
          {produto.pedidoRapido && (
            <span className="text-stone-400"> · ⚡ pedido rápido</span>
          )}
        </p>
        <p className="text-sm text-stone-800 mt-1 font-medium">
          {produto.preco !== null
            ? produto.preco.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "— sem preço"}
          {produto.unidadeCompraLabel && produto.unidadeCompraQuantidade && (
            <span className="text-xs text-stone-400 font-normal">
              {" "}
              ({produto.unidadeCompraLabel} de {produto.unidadeCompraQuantidade})
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-stone-600 hover:text-emerald-700 inline-block py-2 px-2 -my-2"
        >
          Editar
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Excluir "${produto.nome}"?`)) {
              startTransition(async () => {
                await deleteProduto(produto.id);
              });
            }
          }}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 inline-block py-2 px-2 -my-2"
        >
          Excluir
        </button>
      </div>
    </li>
  );
}
