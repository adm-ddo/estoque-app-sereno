"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirContagem } from "../actions";

export default function BotaoExcluirContagem({ contagemId }: { contagemId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir esta Ordem de Compra? Não tem como desfazer.")) {
          startTransition(async () => {
            await excluirContagem(contagemId);
            router.push("/contagem");
          });
        }
      }}
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 self-start"
    >
      🗑️ Excluir esta Ordem de Compra
    </button>
  );
}
