"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";

/** Link pra começar uma contagem nova que, se já existe uma contagem feita
 * hoje (mesmo escopo), pergunta antes: editar a existente ou criar uma nova
 * mesmo assim. Dentro de poucas horas sugere editar; depois de um tempo
 * (LIMIAR_SUGERIR_NOVA_HORAS em lib/contagem.ts) sugere criar nova. Sem
 * contagem hoje, funciona como um link normal. */
export default function BotaoNovaContagem({
  hrefNova,
  hrefEditar,
  horaExistente,
  sugerirNova,
  label,
  className,
}: {
  hrefNova: string;
  hrefEditar: string | null;
  /** Hora já formatada (ex: "14:32") da contagem existente, ou null se não
   * houver nenhuma feita hoje nesse escopo. */
  horaExistente: string | null;
  /** true = já faz tempo, sugere criar nova; false = foi há pouco, sugere editar. */
  sugerirNova: boolean;
  label: string;
  className: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  if (!horaExistente || !hrefEditar) {
    return (
      <a href={hrefNova} className={className}>
        {label}
      </a>
    );
  }

  return (
    <>
      <a
        href={hrefNova}
        onClick={(e) => {
          e.preventDefault();
          setAberto(true);
        }}
        className={className}
      >
        {label}
      </a>
      <ConfirmDialog
        open={aberto}
        title="Já tem uma contagem feita hoje"
        onCancel={() => setAberto(false)}
      >
        <p className="text-sm text-stone-600">
          {sugerirNova
            ? `Foi feita hoje às ${horaExistente}, já faz um tempo. Quer criar uma nova Ordem de Compra separada, ou editar aquela?`
            : `Foi feita hoje às ${horaExistente}, há pouco tempo. Prefere editar essa Ordem de Compra em vez de criar outra?`}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push(sugerirNova ? hrefNova : hrefEditar)}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-2 font-medium transition-colors"
          >
            {sugerirNova ? "Criar nova Ordem de Compra" : "Editar a Ordem existente"}
          </button>
          <button
            type="button"
            onClick={() => router.push(sugerirNova ? hrefEditar : hrefNova)}
            className="rounded-lg border border-stone-300 text-sm px-3 py-2 hover:bg-stone-50"
          >
            {sugerirNova ? "Editar a existente" : "Criar nova mesmo assim"}
          </button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="text-xs text-stone-500 self-center"
          >
            Cancelar
          </button>
        </div>
      </ConfirmDialog>
    </>
  );
}
