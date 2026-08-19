"use client";

import { useActionState } from "react";
import Link from "next/link";
import { entrar } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(entrar, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm w-full max-w-sm"
    >
      <div>
        <h1 className="text-xl font-semibold text-stone-800">Entrar</h1>
        <p className="text-sm text-stone-500 mt-1">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-emerald-700 underline">
            Criar conta
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">E-mail</label>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone-500">Senha</label>
          <Link
            href="/recuperar-senha"
            className="text-xs text-emerald-700 underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <input
          name="senha"
          type="password"
          required
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
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
