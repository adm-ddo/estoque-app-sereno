"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import { voltarParaMaster } from "@/app/master/actions";
import Logo from "@/components/Logo";

const navItems = [
  { href: "/produtos", label: "Produtos" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/contagem", label: "Ordem de Compra" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/configuracoes", label: "Configurações" },
  { href: "/feedback", label: "💬 Fale conosco" },
];

export default function AppHeader({
  logoHref,
  logado,
  dentroDeTenant,
  masterEmEmpresa,
  mostrarEmpresas,
  mostrarEmpresasMaster,
  isMasterSemEmpresa,
  restauranteEfetivoNome,
  isMaster,
  feedbackNaoLidos,
}: {
  logoHref: string;
  logado: boolean;
  dentroDeTenant: boolean;
  masterEmEmpresa: boolean;
  mostrarEmpresas: boolean;
  /** Master também pode ser dono de empresas próprias (fora do painel de
   * supervisão) — mostra o link pra ele cadastrar/entrar nelas quando não
   * está navegando dentro de nenhuma empresa agora. */
  mostrarEmpresasMaster: boolean;
  isMasterSemEmpresa: boolean;
  restauranteEfetivoNome: string | null;
  isMaster: boolean;
  feedbackNaoLidos: number;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

  const temMenu = logado;

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link
          href={logoHref}
          onClick={() => setMenuAberto(false)}
          className="font-semibold text-lg text-stone-800 flex items-center gap-2 shrink-0"
        >
          <Logo size={32} />
          <span className="whitespace-nowrap">SERENO</span>
        </Link>

        {dentroDeTenant && (
          <nav className="hidden sm:flex gap-3 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-stone-500 hover:text-emerald-700 font-medium transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div
          className={`ml-auto items-center gap-4 text-sm ${
            logado ? "hidden sm:flex" : "flex"
          }`}
        >
          <HeaderExtras
            masterEmEmpresa={masterEmEmpresa}
            mostrarEmpresas={mostrarEmpresas}
            mostrarEmpresasMaster={mostrarEmpresasMaster}
            isMasterSemEmpresa={isMasterSemEmpresa}
            restauranteEfetivoNome={restauranteEfetivoNome}
            logado={logado}
            isMaster={isMaster}
            feedbackNaoLidos={feedbackNaoLidos}
          />
        </div>

        {temMenu && (
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            className="ml-auto sm:hidden -mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-stone-600 active:bg-stone-100"
          >
            {menuAberto ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            )}
          </button>
        )}
      </div>

      {temMenu && menuAberto && (
        <div className="sm:hidden border-t border-stone-200 bg-white px-4 py-3 flex flex-col gap-1">
          {dentroDeTenant &&
            navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAberto(false)}
                className={`rounded-lg px-3 py-3 text-base font-medium ${
                  pathname === item.href
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-stone-700 active:bg-stone-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          <div className="border-t border-stone-200 mt-1 pt-2 flex flex-col gap-1 text-sm">
            <HeaderExtras
              masterEmEmpresa={masterEmEmpresa}
              mostrarEmpresas={mostrarEmpresas}
              mostrarEmpresasMaster={mostrarEmpresasMaster}
              isMasterSemEmpresa={isMasterSemEmpresa}
              restauranteEfetivoNome={restauranteEfetivoNome}
              logado={logado}
              isMaster={isMaster}
              feedbackNaoLidos={feedbackNaoLidos}
              empilhado
              onNavigate={() => setMenuAberto(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}

function HeaderExtras({
  masterEmEmpresa,
  mostrarEmpresas,
  mostrarEmpresasMaster,
  isMasterSemEmpresa,
  restauranteEfetivoNome,
  logado,
  isMaster,
  feedbackNaoLidos,
  empilhado = false,
  onNavigate,
}: {
  masterEmEmpresa: boolean;
  mostrarEmpresas: boolean;
  mostrarEmpresasMaster: boolean;
  isMasterSemEmpresa: boolean;
  restauranteEfetivoNome: string | null;
  logado: boolean;
  isMaster: boolean;
  feedbackNaoLidos: number;
  empilhado?: boolean;
  onNavigate?: () => void;
}) {
  const linkClasses = empilhado
    ? "rounded-lg px-3 py-3 text-base font-medium text-stone-700 active:bg-stone-100"
    : "text-stone-500 hover:text-emerald-700 font-medium transition-colors whitespace-nowrap";

  return (
    <>
      {masterEmEmpresa && (
        <form action={voltarParaMaster}>
          <button
            type="submit"
            className={
              empilhado
                ? "w-full text-left rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-3 font-medium"
                : "rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap"
            }
          >
            🏢 {restauranteEfetivoNome} · voltar ao painel master
          </button>
        </form>
      )}
      {mostrarEmpresas && (
        <Link href="/empresas" onClick={onNavigate} className={linkClasses}>
          🏢 {restauranteEfetivoNome ?? "Trocar empresa"}
        </Link>
      )}
      {isMasterSemEmpresa && (
        <Link href="/master" onClick={onNavigate} className={linkClasses}>
          Master
        </Link>
      )}
      {mostrarEmpresasMaster && (
        <Link href="/empresas" onClick={onNavigate} className={linkClasses}>
          🏢 Minhas empresas
        </Link>
      )}
      {isMaster && (
        <Link
          href="/master/feedback"
          onClick={onNavigate}
          className={linkClasses}
        >
          🔔 Sugestões{feedbackNaoLidos > 0 ? ` (${feedbackNaoLidos})` : ""}
        </Link>
      )}
      {logado && (
        <Link href="/meus-dados" onClick={onNavigate} className={linkClasses}>
          Meus dados
        </Link>
      )}
      {logado && (
        <form action={logout}>
          <button
            type="submit"
            className={
              empilhado
                ? "w-full text-left rounded-lg px-3 py-3 text-base font-medium text-stone-700 active:bg-stone-100"
                : "text-stone-500 hover:text-stone-800"
            }
          >
            Sair
          </button>
        </form>
      )}
      {!logado && (
        <Link href="/login" onClick={onNavigate} className={linkClasses}>
          Entrar
        </Link>
      )}
    </>
  );
}
