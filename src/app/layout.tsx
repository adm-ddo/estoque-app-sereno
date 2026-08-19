import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSessao } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SERENO",
  description: "Controle sua operação, paz para sua gestão.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessao = await getSessao();
  const dentroDeTenant = !!sessao?.restauranteEfetivoId;
  const masterEmEmpresa = !!(sessao?.isMaster && sessao.restauranteAtivoId);
  // Mostra o link de trocar/cadastrar empresa pra qualquer dono logado numa
  // empresa — não só quem já tem 2+, senão quem tem só 1 nunca descobre
  // onde cadastrar uma segunda. Master também pode ser dono de empresas
  // próprias (fora do painel de supervisão), então mostra o link pra ele
  // também quando não está navegando dentro de nenhuma empresa agora.
  const mostrarLinkEmpresas =
    !!sessao && !sessao.isMaster && dentroDeTenant;
  const mostrarEmpresasMaster = !!(sessao?.isMaster && !sessao.restauranteAtivoId);
  const feedbackNaoLidos = sessao?.isMaster
    ? await prisma.feedback.count({ where: { lida: false } })
    : 0;

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppHeader
          logoHref={
            sessao
              ? dentroDeTenant
                ? "/produtos"
                : sessao.isMaster
                  ? "/master"
                  : "/empresas"
              : "/"
          }
          logado={!!sessao}
          dentroDeTenant={dentroDeTenant}
          masterEmEmpresa={masterEmEmpresa}
          mostrarEmpresas={mostrarLinkEmpresas}
          mostrarEmpresasMaster={mostrarEmpresasMaster}
          isMasterSemEmpresa={!!(sessao?.isMaster && !sessao.restauranteAtivoId)}
          restauranteEfetivoNome={sessao?.restauranteEfetivoNome ?? null}
          isMaster={!!sessao?.isMaster}
          feedbackNaoLidos={feedbackNaoLidos}
        />
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
