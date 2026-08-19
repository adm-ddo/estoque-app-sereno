"use client";

import { useState } from "react";
import { updateProduto } from "./actions";
import { LOCAIS_ORDEM, LOCAL_INFO, LocalArmazenamento } from "@/lib/locais";
import { UNIDADES } from "@/lib/unidades";
import PrecoProdutoFields from "@/components/PrecoProdutoFields";
import CampoFrequencia from "@/components/CampoFrequencia";

export type ProdutoParaEditar = {
  id: number;
  nome: string;
  unidade: string;
  estoqueRegulador: number;
  local: LocalArmazenamento;
  pedidoDireto: boolean;
  pedidoRapido: boolean;
  preco: number | null;
  unidadeCompraLabel: string | null;
  unidadeCompraQuantidade: number | null;
  precoCompra: number | null;
  observacaoCompra: string | null;
  frequenciaEstoqueDias: number | null;
};

/** Campos de edição de produto, compartilhados entre a linha de tabela
 * (desktop) e o card (mobile) — só muda o elemento que envolve o form. */
export default function ProdutoEditForm({
  produto,
  frequenciaPadraoDias,
  pending,
  onSaved,
  onCancel,
  startTransition,
}: {
  produto: ProdutoParaEditar;
  frequenciaPadraoDias: number;
  pending: boolean;
  onSaved: () => void;
  onCancel: () => void;
  startTransition: (callback: () => Promise<void>) => void;
}) {
  const [local, setLocal] = useState<LocalArmazenamento>(produto.local);
  const [pedidoDireto, setPedidoDireto] = useState(produto.pedidoDireto);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateProduto(produto.id, formData);
          onSaved();
        });
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="flex flex-col">
        <label className="text-xs text-stone-500">Nome</label>
        <input
          name="nome"
          defaultValue={produto.nome}
          required
          className="border border-stone-300 rounded-lg px-2 py-1 text-sm w-full"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-stone-500">Local</label>
        <select
          name="local"
          value={local}
          onChange={(e) => setLocal(e.target.value as LocalArmazenamento)}
          className="border border-stone-300 rounded-lg px-2 py-1 text-sm"
        >
          {LOCAIS_ORDEM.map((opcaoLocal) => (
            <option key={opcaoLocal} value={opcaoLocal}>
              {LOCAL_INFO[opcaoLocal].emoji} {LOCAL_INFO[opcaoLocal].label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-stone-500">Unidade</label>
        <select
          name="unidade"
          defaultValue={produto.unidade}
          className="border border-stone-300 rounded-lg px-2 py-1 text-sm w-20"
        >
          {UNIDADES.map((unidade) => (
            <option key={unidade} value={unidade}>
              {unidade}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-stone-500">Estoque regulador (mínimo)</label>
        {pedidoDireto ? (
          <p className="text-xs text-stone-500 max-w-40 py-1">
            Não usa — pedido direto ativado ao lado.
          </p>
        ) : (
          <input
            name="estoqueRegulador"
            type="number"
            step="any"
            defaultValue={produto.estoqueRegulador}
            className="border border-stone-300 rounded-lg px-2 py-1 text-sm w-28"
          />
        )}
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-stone-500 flex items-center gap-1.5 h-[18px]">
          <input
            type="checkbox"
            name="pedidoDireto"
            checked={pedidoDireto}
            onChange={(e) => setPedidoDireto(e.target.checked)}
            className="rounded border-stone-300"
          />
          Pedido direto
        </label>
        <p className="text-xs text-stone-400 max-w-40 mt-0.5">
          Sem estoque regulador — o pedido já é a quantidade direta que a
          pessoa escrever.
        </p>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-stone-500 flex items-center gap-1.5 h-[18px]">
          <input
            type="checkbox"
            name="pedidoRapido"
            defaultChecked={produto.pedidoRapido}
            className="rounded border-stone-300"
          />
          Permitir pedido rápido
        </label>
        <p className="text-xs text-stone-400 max-w-40 mt-0.5">
          Sai da Ordem de Compra semanal e vai pro atalho ⚡ Pedido Rápido —
          pode ser pedido/contado sempre que precisar.
        </p>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-stone-500">Frequência</label>
        <CampoFrequencia
          frequenciaPadraoDias={frequenciaPadraoDias}
          defaultValue={produto.frequenciaEstoqueDias}
          className="border border-stone-300 rounded-lg px-2 py-1 text-sm"
        />
      </div>
      <PrecoProdutoFields
        defaultPreco={produto.preco}
        defaultUnidadeCompraLabel={produto.unidadeCompraLabel}
        defaultUnidadeCompraQuantidade={produto.unidadeCompraQuantidade}
        defaultPrecoCompra={produto.precoCompra}
        defaultObservacaoCompra={produto.observacaoCompra}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-stone-300 text-sm px-3 py-1.5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
