"use client";

import { useState, useTransition } from "react";
import { enviarFeedback } from "./actions";
import { TIPOS_FEEDBACK } from "@/lib/feedback";

export default function FeedbackForm() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [linkWhatsApp, setLinkWhatsApp] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const resultado = await enviarFeedback(formData);
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      setLinkWhatsApp(resultado.linkWhatsApp);
      form.reset();
    });
  }

  if (linkWhatsApp) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col gap-3">
        <p className="text-sm text-emerald-800">
          ✅ Mensagem salva! Agora é só confirmar o envio pelo WhatsApp pra
          gente te responder rapidinho.
        </p>
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 font-medium text-center transition-colors"
        >
          📲 Enviar no WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setLinkWhatsApp(null)}
          className="text-xs text-stone-500 hover:text-stone-700 self-start"
        >
          Mandar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Tipo</label>
        <select
          name="tipo"
          defaultValue={TIPOS_FEEDBACK[0].valor}
          className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {TIPOS_FEEDBACK.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Mensagem</label>
        <textarea
          name="mensagem"
          required
          rows={4}
          placeholder="Conta pra gente..."
          className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 font-medium transition-colors disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
