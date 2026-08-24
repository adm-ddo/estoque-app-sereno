"use client";

import { useState, useTransition } from "react";
import { deleteProduto } from "./actions";
import { LOCAL_INFO } from "@/lib/locais";
import { labelFrequencia } from "@/lib/frequencia";
import ProdutoEditForm, { type ProdutoParaEditar } from "./ProdutoEditForm";

/** Linha de tabela — usada na lista desktop (telas ≥ sm). No mobile a lista
 * usa ProdutoCard em vez desta, pra não depender de scroll horizontal. */
export default function ProdutoRow({
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
      <tr className="border-t border-stone-200">
        <td colSpan={6} className="p-2">
          <ProdutoEditForm
            produto={produto}
            frequenciaPadraoDias={frequenciaPadraoDias}
            pending={pending}
            startTransition={startTransition}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  const info = LOCAL_INFO[produto.local];

  return (
    <tr className="border-t border-stone-200">
      <td className="p-2">{produto.nome}</td>
      <td className="p-2">
        <span
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${info.badge}`}
        >
          {info.emoji} {info.label}
        </span>
      </td>
      <td className="p-2">{produto.unidade}</td>
      <td className="p-2">
        {produto.pedidoDireto ? (
          <span className="text-stone-400">
            — pedido direto
            {produto.pedidoMinimo != null && ` · mín. ${produto.pedidoMinimo}`}
          </span>
        ) : (
          produto.estoqueRegulador
        )}
        {produto.frequenciaEstoqueDias && (
          <p className="text-xs text-stone-400 whitespace-nowrap">
            {labelFrequencia(produto.frequenciaEstoqueDias)}
          </p>
        )}
        {produto.pedidoRapido && (
          <p className="text-xs text-stone-400 whitespace-nowrap">
            ⚡ pedido rápido
          </p>
        )}
      </td>
      <td className="p-2">
        {produto.preco !== null
          ? produto.preco.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : "—"}
        {produto.unidadeCompraLabel && produto.unidadeCompraQuantidade && (
          <p className="text-xs text-stone-400 whitespace-nowrap">
            {produto.unidadeCompraLabel} de {produto.unidadeCompraQuantidade}
          </p>
        )}
      </td>
      <td className="p-2 text-right">
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
      </td>
    </tr>
  );
}
