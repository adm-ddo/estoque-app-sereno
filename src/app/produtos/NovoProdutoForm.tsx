"use client";

import { useRef, useState, useTransition } from "react";
import { checkProdutoSimilar, createProduto } from "./actions";
import { LOCAIS_ORDEM, LOCAL_INFO } from "@/lib/locais";
import { UNIDADES } from "@/lib/unidades";
import ConfirmDialog from "@/components/ConfirmDialog";
import PrecoProdutoFields from "@/components/PrecoProdutoFields";
import CampoFrequencia from "@/components/CampoFrequencia";

type Similar = { id: number; nome: string; unidade: string };

export default function NovoProdutoForm({
  frequenciaPadraoDias,
}: {
  frequenciaPadraoDias: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [similares, setSimilares] = useState<Similar[]>([]);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [local, setLocal] = useState("ESTOQUE_SECO");
  const [pedidoDireto, setPedidoDireto] = useState(false);
  // CampoPreco é controlado, então form.reset() nativo não limpa ele — força
  // remontar (e voltar ao estado inicial) trocando a key depois de salvar.
  const [precoKey, setPrecoKey] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const formData = new FormData(e.currentTarget);
    const nome = String(formData.get("nome") ?? "");

    startTransition(async () => {
      try {
        const matches = await checkProdutoSimilar(nome);
        if (matches.length > 0) {
          setSimilares(matches);
          setPendingData(formData);
          return;
        }
        await createProduto(formData);
        formRef.current?.reset();
        setLocal("ESTOQUE_SECO");
        setPedidoDireto(false);
        setPrecoKey((k) => k + 1);
      } catch {
        setErro("Não foi possível salvar o produto.");
      }
    });
  }

  function cancelar() {
    setSimilares([]);
    setPendingData(null);
  }

  function confirmar() {
    if (!pendingData) return;
    pendingData.set("confirmarDuplicado", "true");
    startTransition(async () => {
      try {
        await createProduto(pendingData);
        formRef.current?.reset();
        setLocal("ESTOQUE_SECO");
        setPedidoDireto(false);
        setPrecoKey((k) => k + 1);
      } catch {
        setErro("Não foi possível salvar o produto.");
      } finally {
        setSimilares([]);
        setPendingData(null);
      }
    });
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Nome</label>
          <input
            name="nome"
            required
            placeholder="Ex: Óleo de soja"
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Local</label>
          <select
            name="local"
            value={local}
            onChange={(e) => {
              setLocal(e.target.value);
              if (e.target.value === "HORTIFRUTI") setPedidoDireto(true);
            }}
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            defaultValue="UN"
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <p className="text-xs text-stone-500 max-w-40 py-1.5">
              Não usa — pedido direto ativado ao lado.
            </p>
          ) : (
            <input
              name="estoqueRegulador"
              type="number"
              step="any"
              defaultValue={0}
              className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="rounded border-stone-300"
            />
            Permitir pedido rápido
          </label>
          <p className="text-xs text-stone-400 max-w-40 mt-0.5">
            Sai da Ordem de Compra semanal e vai pro atalho ⚡ Pedido Rápido
            — pode ser pedido/contado sempre que precisar, sem trava de
            ciclo.
          </p>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Frequência de estoque</label>
          <CampoFrequencia
            frequenciaPadraoDias={frequenciaPadraoDias}
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <PrecoProdutoFields key={precoKey} />
        {erro && <p className="text-red-600 text-sm w-full">{erro}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-1.5 font-medium transition-colors disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      <ConfirmDialog
        open={similares.length > 0}
        title="Já existe um produto parecido"
        onCancel={cancelar}
      >
        <ul className="text-sm text-stone-700 list-disc list-inside">
          {similares.map((p) => (
            <li key={p.id}>
              {p.nome} ({p.unidade})
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500">
          Confirme se quer cadastrar um novo produto mesmo assim (ex: outro
          tamanho de embalagem).
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelar}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirmar}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Criar mesmo assim
          </button>
        </div>
      </ConfirmDialog>
    </>
  );
}
