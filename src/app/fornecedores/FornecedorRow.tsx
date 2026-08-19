"use client";

import { useState, useTransition } from "react";
import { updateFornecedor, deleteFornecedor } from "./actions";
import FornecedorForm from "./FornecedorForm";
import { LocalArmazenamento } from "@/lib/locais";

type Produto = { id: number; nome: string; unidade: string; local: LocalArmazenamento };
type Fornecedor = {
  id: number;
  nome: string;
  documento: string;
  contatoNome: string | null;
  telefone: string | null;
  produtos: { produto: Produto }[];
};

export default function FornecedorRow({
  fornecedor,
  produtos,
}: {
  fornecedor: Fornecedor;
  produtos: Produto[];
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="border border-stone-200 rounded-2xl bg-white p-4 shadow-sm">
        <form
          action={(formData) => {
            startTransition(async () => {
              await updateFornecedor(fornecedor.id, formData);
              setEditing(false);
            });
          }}
          className="flex flex-col gap-3"
        >
          <FornecedorForm
            produtos={produtos}
            defaultNome={fornecedor.nome}
            defaultDocumento={fornecedor.documento}
            defaultContatoNome={fornecedor.contatoNome ?? ""}
            defaultTelefone={fornecedor.telefone ?? ""}
            defaultProdutoIds={fornecedor.produtos.map((p) => p.produto.id)}
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
              onClick={() => setEditing(false)}
              className="rounded-lg border border-stone-300 text-sm px-3 py-1.5"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="border border-stone-200 rounded-2xl bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-stone-800">{fornecedor.nome}</p>
          <p className="text-sm text-stone-500">{fornecedor.documento}</p>
          {(fornecedor.contatoNome || fornecedor.telefone) && (
            <p className="text-sm text-stone-500">
              {[fornecedor.contatoNome, fornecedor.telefone]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <p className="text-sm text-stone-600 mt-1">
            {fornecedor.produtos.length === 0
              ? "Nenhum produto associado"
              : fornecedor.produtos.map((p) => p.produto.nome).join(", ")}
          </p>
        </div>
        <div className="flex shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-stone-600 hover:text-emerald-700 inline-block py-2 px-2 -my-2"
          >
            Editar
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm(`Excluir "${fornecedor.nome}"?`)) {
                startTransition(async () => {
                  await deleteFornecedor(fornecedor.id);
                });
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 inline-block py-2 px-2 -my-2"
          >
            Excluir
          </button>
        </div>
      </div>
    </li>
  );
}
