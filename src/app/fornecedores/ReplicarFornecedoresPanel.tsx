"use client";

import { useState, useTransition } from "react";
import { replicarFornecedoresSelecionados } from "./actions";

type Loja = { id: number; nome: string };
type Fornecedor = { id: number; nome: string };

export default function ReplicarFornecedoresPanel({
  fornecedores,
  outrasLojas,
}: {
  fornecedores: Fornecedor[];
  outrasLojas: Loja[];
}) {
  const [aberto, setAberto] = useState(false);
  const [destino, setDestino] = useState("");
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<
    { tipo: "ok" | "erro"; texto: string } | null
  >(null);

  if (outrasLojas.length === 0 || fornecedores.length === 0) return null;

  const todosSelecionados = selecionados.size === fornecedores.length;

  function alternar(id: number) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function alternarTodos() {
    setSelecionados(
      todosSelecionados ? new Set() : new Set(fornecedores.map((f) => f.id))
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="self-start rounded-lg border border-dashed border-stone-300 text-stone-600 hover:border-emerald-400 hover:text-emerald-700 text-sm px-4 py-2 transition-colors"
      >
        🏢 Replicar fornecedores pra outra loja
      </button>
    );
  }

  function replicar() {
    if (!destino || selecionados.size === 0) return;
    const lojaDestino = outrasLojas.find((l) => String(l.id) === destino);
    const confirmado = window.confirm(
      `Replicar ${selecionados.size} fornecedor(es) para "${lojaDestino?.nome ?? "loja selecionada"}"? Confira se essa é a loja certa antes de continuar.`
    );
    if (!confirmado) return;

    setMensagem(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("restauranteDestinoId", destino);
      for (const id of selecionados) {
        formData.append("fornecedorIds", String(id));
      }
      const resultado = await replicarFornecedoresSelecionados(formData);
      if ("erro" in resultado) {
        setMensagem({ tipo: "erro", texto: resultado.erro });
      } else {
        setMensagem({
          tipo: "ok",
          texto: `${resultado.quantidade} fornecedor(es) replicado(s) com sucesso.`,
        });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-stone-800">Replicar fornecedores</h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          Fechar
        </button>
      </div>
      <p className="text-xs text-stone-500">
        Marque os fornecedores que quer copiar (nome, documento e contato)
        pra outra loja. Não replica os produtos que cada um vende aqui —
        cada loja vende coisas diferentes, então vincule os produtos certos
        do destino depois, editando o fornecedor já replicado.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Loja de destino</label>
        <select
          value={destino}
          onChange={(e) => {
            setDestino(e.target.value);
            setMensagem(null);
          }}
          className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm self-start"
        >
          <option value="" disabled>
            Selecione a loja...
          </option>
          {outrasLojas.map((loja) => (
            <option key={loja.id} value={loja.id}>
              {loja.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone-500">Fornecedores</label>
          <button
            type="button"
            onClick={alternarTodos}
            className="text-xs text-emerald-700 underline"
          >
            {todosSelecionados ? "Desmarcar todos" : "Marcar todos"}
          </button>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-stone-200 p-2 max-h-56 overflow-y-auto">
          {fornecedores.map((fornecedor) => (
            <label key={fornecedor.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={selecionados.has(fornecedor.id)}
                onChange={() => alternar(fornecedor.id)}
                className="accent-emerald-600"
              />
              {fornecedor.nome}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || !destino || selecionados.size === 0}
          onClick={replicar}
          className="self-start rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 font-medium transition-colors disabled:opacity-50"
        >
          {pending
            ? "Replicando..."
            : `Replicar ${selecionados.size > 0 ? `(${selecionados.size})` : ""}`}
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
