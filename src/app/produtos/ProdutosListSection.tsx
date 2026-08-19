"use client";

import { useMemo, useState } from "react";
import { LOCAIS_ORDEM, LOCAL_INFO } from "@/lib/locais";
import ProdutoRow from "./ProdutoRow";
import ProdutoCard from "./ProdutoCard";
import type { ProdutoParaEditar } from "./ProdutoEditForm";

const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(MARCAS_DIACRITICAS, "").toLowerCase();
}

type OrdenarPor = "nome" | "local";

export default function ProdutosListSection({
  produtos,
  frequenciaPadraoDias,
}: {
  produtos: ProdutoParaEditar[];
  frequenciaPadraoDias: number;
}) {
  const [busca, setBusca] = useState("");
  const [localFiltro, setLocalFiltro] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("nome");

  const produtosFiltrados = useMemo(() => {
    const buscaNormalizada = normalizar(busca.trim());
    const filtrados = produtos.filter((produto) => {
      if (localFiltro && produto.local !== localFiltro) return false;
      if (buscaNormalizada && !normalizar(produto.nome).includes(buscaNormalizada)) {
        return false;
      }
      return true;
    });

    return filtrados.sort((a, b) => {
      if (ordenarPor === "local") {
        const posicaoLocal = LOCAIS_ORDEM.indexOf(a.local) - LOCAIS_ORDEM.indexOf(b.local);
        if (posicaoLocal !== 0) return posicaoLocal;
      }
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [produtos, busca, localFiltro, ordenarPor]);

  const filtroAtivo = busca.trim() !== "" || localFiltro !== "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col flex-1 min-w-[180px]">
          <label className="text-xs text-stone-500">Pesquisar produto</label>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Local</label>
          <select
            value={localFiltro}
            onChange={(e) => setLocalFiltro(e.target.value)}
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos os locais</option>
            {LOCAIS_ORDEM.map((local) => (
              <option key={local} value={local}>
                {LOCAL_INFO[local].emoji} {LOCAL_INFO[local].label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Ordenar por</label>
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as OrdenarPor)}
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="nome">Nome (A-Z)</option>
            <option value="local">Local</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-stone-500">
        {filtroAtivo
          ? `${produtosFiltrados.length} de ${produtos.length} produtos`
          : `${produtos.length} ${produtos.length === 1 ? "produto cadastrado" : "produtos cadastrados"}`}
      </p>

      {produtos.length === 0 && (
        <p className="text-stone-500 text-sm text-center py-4">
          Nenhum produto cadastrado ainda.
        </p>
      )}

      {produtos.length > 0 && produtosFiltrados.length === 0 && (
        <p className="text-stone-500 text-sm text-center py-4">
          Nenhum produto encontrado com esse filtro.
        </p>
      )}

      <ul className="sm:hidden flex flex-col gap-3">
        {produtosFiltrados.map((produto) => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            frequenciaPadraoDias={frequenciaPadraoDias}
          />
        ))}
      </ul>

      {produtosFiltrados.length > 0 && (
        <div className="hidden sm:block rounded-2xl border border-stone-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-stone-50 text-left text-stone-500">
                <th className="p-2 font-medium">Nome</th>
                <th className="p-2 font-medium">Local</th>
                <th className="p-2 font-medium">Unidade</th>
                <th className="p-2 font-medium">Estoque regulador</th>
                <th className="p-2 font-medium">Preço</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto) => (
                <ProdutoRow
                  key={produto.id}
                  produto={produto}
                  frequenciaPadraoDias={frequenciaPadraoDias}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
