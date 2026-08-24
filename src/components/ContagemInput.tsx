"use client";

import { useState } from "react";

export default function ContagemInput({
  name,
  unidade,
  valorInicial,
  avisoTexto,
}: {
  name: string;
  unidade: string;
  valorInicial?: number | null;
  /** Se preenchido, o campo começa travado com esse aviso (ex: "Já contado
   * em 28/07 · Quinzenal") em vez dos controles normais — a pessoa precisa
   * clicar em "Contar mesmo assim" pra destravar. */
  avisoTexto?: string | null;
}) {
  const [valor, setValor] = useState(
    valorInicial != null ? String(valorInicial) : ""
  );
  const [destravado, setDestravado] = useState(!avisoTexto);

  function ajustar(delta: number) {
    const atual = parseFloat(valor || "0");
    const novo = Math.max(0, Math.round((atual + delta) * 100) / 100);
    setValor(String(novo));
  }

  if (!destravado) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <p className="text-xs text-red-600 max-w-32 leading-tight">{avisoTexto}</p>
        <button
          type="button"
          onClick={() => setDestravado(true)}
          className="text-xs text-stone-500 underline shrink-0"
        >
          Contar mesmo assim
        </button>
      </div>
    );
  }

  const confirmadoZerado = valor === "0";

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
      <button
        type="button"
        onClick={() => ajustar(-1)}
        aria-label="Diminuir"
        className="h-12 w-12 shrink-0 rounded-xl border border-stone-300 text-2xl font-medium text-stone-600 active:bg-stone-100"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        name={name}
        required
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="0"
        className={`h-12 w-20 rounded-xl border text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          confirmadoZerado ? "border-emerald-400 bg-emerald-50" : "border-stone-300"
        }`}
      />
      <button
        type="button"
        onClick={() => ajustar(1)}
        aria-label="Aumentar"
        className="h-12 w-12 shrink-0 rounded-xl border border-stone-300 text-2xl font-medium text-stone-600 active:bg-stone-100"
      >
        +
      </button>
      <span className="text-sm text-stone-500 w-10">{unidade}</span>
      <button
        type="button"
        onClick={() => setValor("0")}
        className={`text-xs rounded-lg border px-2 py-1.5 shrink-0 transition-colors ${
          confirmadoZerado
            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
            : "border-stone-300 text-stone-500 hover:bg-stone-50"
        }`}
      >
        {confirmadoZerado ? "✓ Zerado" : "Marcar zero"}
      </button>
    </div>
  );
}
