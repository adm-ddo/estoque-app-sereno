"use client";

import { useTransition } from "react";
import { acessarEmpresa, excluirRestauranteMaster } from "./actions";

type Restaurante = {
  id: number;
  nome: string;
  cnpj: string;
  endereco: string;
  counts: { produtos: number; fornecedores: number; contagens: number };
};

export default function RestauranteMasterRow({
  restaurante,
}: {
  restaurante: Restaurante;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-xl border border-stone-200 bg-stone-50 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-stone-800">{restaurante.nome}</p>
        <p className="text-sm text-stone-500">
          {restaurante.cnpj} · {restaurante.endereco}
        </p>
        <p className="text-sm text-stone-600 mt-1">
          {restaurante.counts.produtos} produtos ·{" "}
          {restaurante.counts.fornecedores} fornecedores ·{" "}
          {restaurante.counts.contagens} contagens
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button
          disabled={pending}
          onClick={() => {
            if (
              confirm(
                `Apagar "${restaurante.nome}" (${restaurante.cnpj}) de verdade? Isso apaga TODOS os produtos, fornecedores e o histórico de contagens dessa empresa, sem volta.`
              )
            ) {
              startTransition(async () => {
                await excluirRestauranteMaster(restaurante.id);
              });
            }
          }}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 inline-block py-2 px-2 -my-2"
        >
          Excluir permanentemente
        </button>
        <form action={acessarEmpresa.bind(null, restaurante.id)}>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 font-medium transition-colors shrink-0"
          >
            Acessar
          </button>
        </form>
      </div>
    </li>
  );
}
