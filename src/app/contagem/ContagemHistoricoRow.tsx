"use client";

import { useTransition } from "react";
import Link from "next/link";
import { excluirContagem } from "./actions";

export default function ContagemHistoricoRow({
  contagem,
  dataFormatada,
  podeExcluir,
}: {
  contagem: { id: number; itensContados: number };
  dataFormatada: string;
  podeExcluir: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="relative">
      <Link
        href={`/contagem/${contagem.id}`}
        className={`flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all ${
          podeExcluir ? "pr-24" : ""
        }`}
      >
        <span className="text-stone-800">{dataFormatada}</span>
        <span className="text-sm text-stone-500">
          {contagem.itensContados} itens contados
        </span>
      </Link>
      {podeExcluir && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Excluir esta Ordem de Compra? Não tem como desfazer.")) {
              startTransition(async () => {
                await excluirContagem(contagem.id);
              });
            }
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 bg-white"
        >
          Excluir
        </button>
      )}
    </li>
  );
}
