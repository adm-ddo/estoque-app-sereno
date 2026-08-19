import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import Logo from "@/components/Logo";

export default async function Home() {
  const sessao = await getSessao();

  if (sessao?.restauranteEfetivoId) redirect("/produtos");
  if (sessao?.isMaster) redirect("/master");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center py-12">
      <Logo size={64} />
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">SERENO</h1>
        <p className="text-emerald-700 font-medium mt-1">
          Controle sua operação, paz para sua gestão.
        </p>
        <p className="text-stone-600 mt-1 max-w-md">
          Contagem semanal, cálculo automático do que falta e pedidos prontos
          para o WhatsApp dos seus fornecedores.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/cadastro"
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 transition-colors"
        >
          Cadastrar meu restaurante
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium px-5 py-2.5 transition-colors"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
