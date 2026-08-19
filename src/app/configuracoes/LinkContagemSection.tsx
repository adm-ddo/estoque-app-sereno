"use client";

import { useState, useTransition } from "react";
import { regenerarTokenContagem } from "./actions";

type Props = {
  origem: string;
  token: string;
};

export default function LinkContagemSection({ origem, token: tokenInicial }: Props) {
  const [token, setToken] = useState(tokenInicial);
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();

  const link = `${origem}/c/${token}`;

  function copiarLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function gerarNovoLink() {
    const confirmado = window.confirm(
      "Gerar um novo link vai desativar o link atual imediatamente — quem tiver o link antigo salvo não vai mais conseguir acessar. Continuar?"
    );
    if (!confirmado) return;

    startTransition(async () => {
      const resultado = await regenerarTokenContagem();
      setToken(resultado.token);
      setCopiado(false);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm max-w-lg">
      <div>
        <h2 className="font-semibold text-stone-800">Link de contagem</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Envie esse link pra quem vai fazer a contagem de estoque (o
          funcionário responsável). Ele não precisa de login — abre o link
          pelo celular, faz a contagem e dispara os pedidos, quantas vezes
          precisar na semana.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={link}
          onFocus={(evento) => evento.currentTarget.select()}
          className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm bg-stone-50 text-stone-700"
        />
        <button
          type="button"
          onClick={copiarLink}
          className="rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium px-4 py-2 transition-colors"
        >
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition-colors"
      >
        Fazer minha contagem agora
      </a>
      <p className="text-xs text-stone-500 -mt-1">
        Sozinho na operação? Use esse botão pra fazer sua própria contagem
        pelo mesmo link — sem precisar copiar e colar em outra aba.
      </p>

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Trate esse link como uma senha: quem tiver esse link consegue lançar
        contagens dessa loja. Compartilhe só com quem precisa.
      </p>

      <button
        type="button"
        onClick={gerarNovoLink}
        disabled={pending}
        className="self-start rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-sm font-medium px-4 py-2 disabled:opacity-50 transition-colors"
      >
        {pending ? "Gerando..." : "Gerar novo link"}
      </button>
    </div>
  );
}
