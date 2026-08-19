"use client";

import { useActionState } from "react";
import Link from "next/link";
import { recuperarSenha } from "./actions";

export default function RecuperarSenhaForm() {
  const [state, formAction, pending] = useActionState(
    recuperarSenha,
    undefined
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm w-full max-w-md"
    >
      <div>
        <h1 className="text-xl font-semibold text-stone-800">
          Recuperar senha
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Informe seu nome completo e CPF (os mesmos do cadastro) pra criar
          uma senha nova.{" "}
          <Link href="/login" className="text-emerald-700 underline">
            Voltar ao login
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Nome completo</label>
        <input
          name="nomeCompleto"
          required
          placeholder="Ex: João da Silva"
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">CPF</label>
        <input
          name="cpf"
          required
          placeholder="Ex: 123.456.789-00"
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Nova senha</label>
        <input
          name="novaSenha"
          type="password"
          required
          minLength={8}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Confirmar nova senha</label>
        <input
          name="confirmarSenha"
          type="password"
          required
          minLength={8}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {state?.erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 mt-1 disabled:opacity-50 transition-colors"
      >
        {pending ? "Trocando senha..." : "Trocar senha"}
      </button>
    </form>
  );
}
