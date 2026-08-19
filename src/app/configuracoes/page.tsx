import { headers } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import ConfiguracoesForm from "./ConfiguracoesForm";
import LinkContagemSection from "./LinkContagemSection";
import AjudaTela from "@/components/AjudaTela";

export default async function ConfiguracoesPage() {
  const sessao = await requireTenant();
  const restaurante = await prisma.restaurante.findUnique({
    where: { id: sessao.restauranteEfetivoId },
    select: {
      nome: true,
      cnpj: true,
      endereco: true,
      logo: true,
      responsavelComprasNome: true,
      responsavelComprasTelefone: true,
      responsavelComprasNome2: true,
      responsavelComprasTelefone2: true,
      frequenciaEstoquePadraoDias: true,
      tokenContagem: true,
    },
  });

  if (!restaurante) {
    return <p className="text-stone-500 text-sm">Restaurante não encontrado.</p>;
  }

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const protocolo = host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
  const origem = `${protocolo}://${host}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Configurações
        </h1>
        <p className="text-stone-600 mt-1 text-sm">
          Dados do restaurante e contato de quem recebe a lista de compras
          completa.
        </p>
      </div>

      <AjudaTela>
        <p>
          Cadastre aqui os <strong>2 contatos</strong> que vão receber as
          Ordens de Compra prontas no WhatsApp — geralmente o próprio dono e
          quem mais cuida das compras.
        </p>
        <p>
          Logo abaixo você também gera o <strong>link de contagem</strong>{" "}
          pra mandar pro time da loja preencher, sem precisar de login.
        </p>
      </AjudaTela>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-stone-800">Outras empresas</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cadastre outro CNPJ no seu login ou troque entre as empresas que
            você já tem, sem precisar sair.
          </p>
        </div>
        <Link
          href="/empresas"
          className="rounded-lg border border-stone-300 text-sm px-4 py-2 hover:bg-stone-50 shrink-0"
        >
          🏢 Trocar / cadastrar empresa
        </Link>
      </div>

      <LinkContagemSection origem={origem} token={restaurante.tokenContagem} />

      <ConfiguracoesForm
        nome={restaurante.nome}
        cnpj={restaurante.cnpj}
        endereco={restaurante.endereco}
        logo={restaurante.logo}
        responsavelComprasNome={restaurante.responsavelComprasNome ?? ""}
        responsavelComprasTelefone={restaurante.responsavelComprasTelefone ?? ""}
        responsavelComprasNome2={restaurante.responsavelComprasNome2 ?? ""}
        responsavelComprasTelefone2={restaurante.responsavelComprasTelefone2 ?? ""}
        frequenciaEstoquePadraoDias={restaurante.frequenciaEstoquePadraoDias}
      />
    </div>
  );
}
