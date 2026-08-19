"use client";

import { useTransition } from "react";
import { marcarFeedbackLida } from "../actions";
import { labelTipoFeedback } from "@/lib/feedback";
import { montarLinkWhatsAppDireto } from "@/lib/pedidos";
import { formatarDataHora } from "@/lib/data";

type Feedback = {
  id: number;
  tipo: string;
  mensagem: string;
  usuarioNome: string | null;
  usuarioEmail: string | null;
  usuarioTelefone: string | null;
  restauranteNome: string | null;
  lida: boolean;
  criadoEm: Date;
};

export default function FeedbackRow({ feedback }: { feedback: Feedback }) {
  const [pending, startTransition] = useTransition();

  const linkResposta = feedback.usuarioTelefone
    ? montarLinkWhatsAppDireto(
        feedback.usuarioTelefone,
        `Oi${feedback.usuarioNome ? `, ${feedback.usuarioNome}` : ""}! Aqui é o Thiago do SERENO, sobre sua mensagem: "${feedback.mensagem}"`
      )
    : null;

  return (
    <li
      className={`rounded-2xl border p-4 shadow-sm flex flex-col gap-2 ${
        feedback.lida
          ? "border-stone-200 bg-white"
          : "border-emerald-300 bg-emerald-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-medium text-stone-500">
          {labelTipoFeedback(feedback.tipo)}
        </span>
        <span className="text-xs text-stone-400">
          {formatarDataHora(feedback.criadoEm)}
        </span>
      </div>

      <p className="text-sm text-stone-800 whitespace-pre-wrap">
        {feedback.mensagem}
      </p>

      <p className="text-xs text-stone-500">
        {feedback.usuarioNome ?? feedback.usuarioEmail ?? "Anônimo"}
        {feedback.restauranteNome ? ` · ${feedback.restauranteNome}` : ""}
        {feedback.usuarioTelefone ? ` · ${feedback.usuarioTelefone}` : ""}
      </p>

      <div className="flex items-center gap-2 flex-wrap mt-1">
        {linkResposta && (
          <a
            href={linkResposta}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 font-medium transition-colors"
          >
            📲 Responder no WhatsApp
          </a>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await marcarFeedbackLida(feedback.id, !feedback.lida);
            })
          }
          className="rounded-lg border border-stone-300 text-xs px-3 py-1.5 disabled:opacity-50"
        >
          {feedback.lida ? "Marcar como não lida" : "Marcar como lida"}
        </button>
      </div>
    </li>
  );
}
