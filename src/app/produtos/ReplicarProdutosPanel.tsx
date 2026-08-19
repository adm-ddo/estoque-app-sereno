"use client";

import { useState, useTransition } from "react";
import { replicarProdutos } from "./actions";
import { LOCAIS_ORDEM, LOCAL_INFO, type LocalArmazenamento } from "@/lib/locais";

type Loja = { id: number; nome: string };
type Produto = { id: number; nome: string };

export default function ReplicarProdutosPanel({
  produtos,
  outrasLojas,
}: {
  produtos: Produto[];
  outrasLojas: Loja[];
}) {
  const [aberto, setAberto] = useState(false);
  const [destino, setDestino] = useState(
    outrasLojas[0] ? String(outrasLojas[0].id) : ""
  );
  const [modo, setModo] = useState<"todos" | "categorias" | "individual">(
    "todos"
  );
  const [categorias, setCategorias] = useState<Set<LocalArmazenamento>>(new Set());
  const [produtoId, setProdutoId] = useState(
    produtos[0] ? String(produtos[0].id) : ""
  );
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<
    { tipo: "ok" | "erro"; texto: string } | null
  >(null);

  if (outrasLojas.length === 0 || produtos.length === 0) return null;

  function alternarCategoria(local: LocalArmazenamento) {
    setCategorias((atual) => {
      const novo = new Set(atual);
      if (novo.has(local)) novo.delete(local);
      else novo.add(local);
      return novo;
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="self-start rounded-lg border border-dashed border-stone-300 text-stone-600 hover:border-emerald-400 hover:text-emerald-700 text-sm px-4 py-2 transition-colors"
      >
        🏢 Replicar produtos pra outra loja
      </button>
    );
  }

  function replicar() {
    if (!destino) return;
    if (modo === "categorias" && categorias.size === 0) return;
    setMensagem(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("restauranteDestinoId", destino);
      formData.set("modo", modo);
      if (modo === "categorias") {
        for (const local of categorias) formData.append("locais", local);
      }
      if (modo === "individual") formData.set("produtoId", produtoId);

      const resultado = await replicarProdutos(formData);
      if ("erro" in resultado) {
        setMensagem({ tipo: "erro", texto: resultado.erro });
      } else {
        const partes = [`${resultado.criados} produto(s) copiado(s)`];
        if (resultado.jaExistiam > 0) {
          partes.push(`${resultado.jaExistiam} já existiam lá e foram mantidos`);
        }
        setMensagem({ tipo: "ok", texto: partes.join(" · ") + "." });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-stone-800">Replicar produtos</h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          Fechar
        </button>
      </div>
      <p className="text-xs text-stone-500">
        Copia produtos desta loja pra outra. Produtos que já existem lá com o
        mesmo nome são reaproveitados, não duplicados nem sobrescritos.
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-stone-500">Loja de destino</label>
        <select
          value={destino}
          onChange={(e) => {
            setDestino(e.target.value);
            setMensagem(null);
          }}
          className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
        >
          {outrasLojas.map((loja) => (
            <option key={loja.id} value={loja.id}>
              {loja.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-stone-500">O que replicar</label>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={modo === "todos"}
              onChange={() => setModo("todos")}
            />
            Todos os produtos ({produtos.length})
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={modo === "categorias"}
              onChange={() => setModo("categorias")}
            />
            Categorias
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={modo === "individual"}
              onChange={() => setModo("individual")}
            />
            Um produto
          </label>
        </div>
      </div>

      {modo === "categorias" && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-stone-200 p-2">
          {LOCAIS_ORDEM.map((local) => (
            <label key={local} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={categorias.has(local)}
                onChange={() => alternarCategoria(local)}
                className="accent-emerald-600"
              />
              {LOCAL_INFO[local].emoji} {LOCAL_INFO[local].label}
            </label>
          ))}
        </div>
      )}

      {modo === "individual" && (
        <select
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm self-start"
        >
          {produtos.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.nome}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || (modo === "categorias" && categorias.size === 0)}
          onClick={replicar}
          className="self-start rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 font-medium transition-colors disabled:opacity-50"
        >
          {pending ? "Replicando..." : "Replicar"}
        </button>
        {mensagem && (
          <span
            className={
              mensagem.tipo === "ok"
                ? "text-sm text-emerald-700"
                : "text-sm text-red-600"
            }
          >
            {mensagem.texto}
          </span>
        )}
      </div>
    </div>
  );
}
