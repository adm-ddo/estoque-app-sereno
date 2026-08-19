"use client";

import { useState } from "react";
import CampoPreco from "./CampoPreco";

type Props = {
  defaultPreco?: number | null;
  defaultUnidadeCompraLabel?: string | null;
  defaultUnidadeCompraQuantidade?: number | null;
  defaultPrecoCompra?: number | null;
  defaultObservacaoCompra?: string | null;
};

const inputClasses =
  "border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

export default function PrecoProdutoFields({
  defaultPreco,
  defaultUnidadeCompraLabel,
  defaultUnidadeCompraQuantidade,
  defaultPrecoCompra,
  defaultObservacaoCompra,
}: Props) {
  const [modoEmbalagem, setModoEmbalagem] = useState(
    !!(defaultUnidadeCompraQuantidade && defaultPrecoCompra)
  );
  const [quantidade, setQuantidade] = useState(
    defaultUnidadeCompraQuantidade ? String(defaultUnidadeCompraQuantidade) : ""
  );
  const [precoCompra, setPrecoCompra] = useState<number | null>(
    defaultPrecoCompra ?? null
  );

  const quantidadeNum = Number(quantidade) || null;
  const precoDerivado =
    quantidadeNum && precoCompra ? precoCompra / quantidadeNum : null;

  if (!modoEmbalagem) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">Preço</label>
          <button
            type="button"
            onClick={() => setModoEmbalagem(true)}
            className="text-xs text-emerald-700 underline"
          >
            vem em caixa/embalagem?
          </button>
        </div>
        <CampoPreco
          name="preco"
          defaultValue={defaultPreco}
          required
          className={inputClasses}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border border-stone-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-stone-600">
          Vem em embalagem fechada
        </p>
        <button
          type="button"
          onClick={() => setModoEmbalagem(false)}
          className="text-xs text-stone-500 underline"
        >
          preço direto
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Embalagem</label>
          <input
            name="unidadeCompraLabel"
            defaultValue={defaultUnidadeCompraLabel ?? ""}
            placeholder="Ex: Caixa"
            required
            className={`${inputClasses} w-28`}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Quantidade dentro</label>
          <input
            name="unidadeCompraQuantidade"
            type="number"
            step="any"
            min={0}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Ex: 100"
            required
            className={`${inputClasses} w-24`}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Preço da embalagem</label>
          <CampoPreco
            name="precoCompra"
            defaultValue={defaultPrecoCompra}
            onChangeValor={setPrecoCompra}
            required
            className={`${inputClasses} w-28`}
          />
        </div>
      </div>
      {precoDerivado !== null && (
        <p className="text-xs text-stone-500">
          ={" "}
          {precoDerivado.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          por unidade
        </p>
      )}
      <div className="flex flex-col">
        <label className="text-xs text-stone-500">
          Observação (opcional, vai junto no pedido pro fornecedor)
        </label>
        <input
          name="observacaoCompra"
          defaultValue={defaultObservacaoCompra ?? ""}
          placeholder="Ex: 2,2kg peso bruto / 1,4kg drenado"
          className={inputClasses}
        />
      </div>
      <input type="hidden" name="preco" value={precoDerivado ?? ""} />
    </div>
  );
}
