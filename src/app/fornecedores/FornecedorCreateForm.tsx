"use client";

import { useRef, useState, useTransition } from "react";
import { checkFornecedorDuplicado, createFornecedor } from "./actions";
import FornecedorForm from "./FornecedorForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { LocalArmazenamento } from "@/lib/locais";

type Produto = { id: number; nome: string; unidade: string; local: LocalArmazenamento };
type Duplicado = {
  id: number;
  nome: string;
  documento: string;
  telefone: string | null;
};

export default function FornecedorCreateForm({
  produtos,
}: {
  produtos: Produto[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [duplicados, setDuplicados] = useState<Duplicado[]>([]);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const formData = new FormData(e.currentTarget);
    const documento = String(formData.get("documento") ?? "");
    const telefone = String(formData.get("telefone") ?? "");

    startTransition(async () => {
      try {
        const matches = await checkFornecedorDuplicado(documento, telefone);
        if (matches.length > 0) {
          setDuplicados(matches);
          setPendingData(formData);
          return;
        }
        formData.set("modo", "novo");
        await createFornecedor(formData);
        formRef.current?.reset();
      } catch {
        setErro("Não foi possível salvar o fornecedor.");
      }
    });
  }

  function cancelar() {
    setDuplicados([]);
    setPendingData(null);
  }

  function enviarComModo(modo: "substituir" | "duplicar", substituirId?: number) {
    if (!pendingData) return;
    pendingData.set("modo", modo);
    if (substituirId !== undefined) {
      pendingData.set("substituirId", String(substituirId));
    }
    startTransition(async () => {
      try {
        await createFornecedor(pendingData);
        formRef.current?.reset();
      } catch {
        setErro("Não foi possível salvar o fornecedor.");
      } finally {
        setDuplicados([]);
        setPendingData(null);
      }
    });
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <FornecedorForm produtos={produtos} />
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-1.5 font-medium transition-colors disabled:opacity-50"
          >
            Adicionar fornecedor
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={duplicados.length > 0}
        title="Já existe um fornecedor com esse CNPJ/CPF ou telefone"
        onCancel={cancelar}
      >
        <ul className="flex flex-col gap-2">
          {duplicados.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 p-2"
            >
              <div className="text-sm">
                <p className="font-medium text-stone-800">{f.nome}</p>
                <p className="text-stone-500">
                  {f.documento}
                  {f.telefone ? ` · ${f.telefone}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => enviarComModo("substituir", f.id)}
                className="rounded-lg border border-emerald-300 text-emerald-700 text-xs px-2 py-1 shrink-0 disabled:opacity-50"
              >
                Substituir este
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500">
          Você pode manter só o fornecedor existente, substituir os dados dele
          pelos novos (sem perder os produtos já associados), ou cadastrar
          este como um fornecedor separado mesmo assim.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelar}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
          >
            Manter o existente
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => enviarComModo("duplicar")}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Cadastrar mesmo assim
          </button>
        </div>
      </ConfirmDialog>
    </>
  );
}
