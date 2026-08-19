import Link from "next/link";
import type { GrupoFornecedor, ItemNecessidade } from "@/lib/pedidos";
import {
  montarMensagemWhatsApp,
  montarLinkWhatsApp,
  sugestaoEmbalagem,
  descricaoEmbalagem,
} from "@/lib/pedidos";
import type { AnaliseProduto } from "@/lib/analise-consumo";
import { formatarDataHora } from "@/lib/data";

function ItemComEmbalagem({ item }: { item: ItemNecessidade }) {
  const sugestao = sugestaoEmbalagem(item);
  const embalagem = descricaoEmbalagem(item);
  return (
    <>
      {item.nome}
      {embalagem && <span className="text-stone-500"> ({embalagem})</span>}
      : {item.necessidade} {item.unidade}
      {sugestao && (
        <span className="text-stone-500">
          {" "}
          (≈ {sugestao.embalagens} {sugestao.label})
        </span>
      )}
      {item.observacaoCompra && (
        <span className="text-stone-500"> — {item.observacaoCompra}</span>
      )}
    </>
  );
}

export type ResponsavelCompras = {
  nome: string | null;
  link: string;
};

export default function ListaComprasView({
  dataContagem,
  novaContagemHref,
  pdfHref,
  grupos,
  semFornecedor,
  alertas,
  responsaveis,
  linksInternos = true,
  tituloEscopo,
}: {
  dataContagem: Date;
  novaContagemHref: string;
  pdfHref: string;
  grupos: GrupoFornecedor[];
  semFornecedor: ItemNecessidade[];
  alertas: AnaliseProduto[];
  responsaveis: ResponsavelCompras[];
  /** Falso no fluxo público (link de contagem): omite links pra telas que
   * exigem login (Relatórios, Fornecedores). */
  linksInternos?: boolean;
  /** Nome da categoria quando a contagem foi feita só de um local (ex:
   * pedido diário de Hortifrúti), pra deixar claro que essa Ordem de Compra
   * não cobre a loja inteira. */
  tituloEscopo?: string | null;
}) {
  const temItens = grupos.length > 0 || semFornecedor.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">
            Ordem de Compra{tituloEscopo ? ` — ${tituloEscopo}` : ""}
          </h1>
          <p className="text-stone-600 mt-1 text-sm">
            Contagem de {formatarDataHora(dataContagem)}
          </p>
        </div>
        <Link
          href={novaContagemHref}
          className="rounded-lg border border-stone-300 text-sm px-3 py-1.5 hover:bg-stone-50"
        >
          Nova contagem
        </Link>
      </div>

      {temItens && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-wrap items-center gap-3">
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-stone-300 text-sm px-3 py-1.5 hover:bg-stone-50"
          >
            📄 Baixar PDF
          </a>
          {responsaveis.length > 0 ? (
            responsaveis.map((responsavel, indice) => (
              <a
                key={indice}
                href={responsavel.link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 transition-colors"
              >
                Enviar lista completa para {responsavel.nome || "o responsável"}
              </a>
            ))
          ) : (
            <p className="text-xs text-stone-500">
              {linksInternos ? (
                <>
                  Cadastre o WhatsApp do responsável de compras em{" "}
                  <Link
                    href="/configuracoes"
                    className="text-emerald-700 underline"
                  >
                    Configurações
                  </Link>{" "}
                  para poder enviar a lista completa direto pra ele.
                </>
              ) : (
                "O responsável de compras ainda não foi configurado."
              )}
            </p>
          )}
        </div>
      )}

      {alertas.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            ⚠️ Consumo fora do padrão essa semana
          </p>
          <ul className="text-sm mt-1 list-disc list-inside text-amber-900">
            {alertas.map((a) => (
              <li key={a.produtoId}>
                {a.nome}: {a.consumoUltimaSemana} {a.unidade} essa semana vs
                média de {a.mediaConsumo?.toFixed(1)} {a.unidade} (
                {a.desvioPercentual !== null && a.desvioPercentual >= 0
                  ? "+"
                  : ""}
                {a.desvioPercentual !== null
                  ? (a.desvioPercentual * 100).toFixed(0)
                  : "?"}
                %)
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            Pode ser aumento de vendas, desperdício ou furto — vale conferir.
            {linksInternos && (
              <>
                {" "}
                Veja a evolução completa em{" "}
                <Link href="/relatorios" className="underline">
                  Relatórios
                </Link>
                .
              </>
            )}
          </p>
        </div>
      )}

      {grupos.length === 0 && semFornecedor.length === 0 && (
        <p className="text-stone-600 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          🎉 Nenhum item precisa ser comprado agora. Estoque em dia!
        </p>
      )}

      {grupos.map((grupo) => {
        const mensagem = montarMensagemWhatsApp(grupo);
        const link = montarLinkWhatsApp(mensagem);
        return (
          <div
            key={grupo.fornecedorId}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-medium text-stone-800 break-words">{grupo.nome}</h2>
                <p className="text-xs text-stone-500">
                  Ao clicar, escolha o grupo do WhatsApp deste fornecedor na
                  lista de conversas
                </p>
              </div>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 transition-colors shrink-0"
              >
                Enviar WhatsApp
              </a>
            </div>

            {grupo.itensPedido.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase">
                  Pedido
                </p>
                <ul className="text-sm mt-1 list-disc list-inside text-stone-700">
                  {grupo.itensPedido.map((item) => (
                    <li key={item.produtoId}>
                      <ItemComEmbalagem item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {grupo.itensOrcamento.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-700 uppercase">
                  Solicitar orçamento (mais de 1 fornecedor vende)
                </p>
                <ul className="text-sm mt-1 list-disc list-inside text-stone-700">
                  {grupo.itensOrcamento.map((item) => (
                    <li key={item.produtoId}>
                      <ItemComEmbalagem item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {semFornecedor.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Itens sem fornecedor cadastrado
          </p>
          <ul className="text-sm mt-1 list-disc list-inside text-amber-900">
            {semFornecedor.map((item) => {
              const sugestao = sugestaoEmbalagem(item);
              const embalagem = descricaoEmbalagem(item);
              return (
                <li key={item.produtoId}>
                  {item.nome}
                  {embalagem && (
                    <span className="text-amber-700"> ({embalagem})</span>
                  )}
                  : precisa de {item.necessidade} {item.unidade}
                  {sugestao && (
                    <span className="text-amber-700">
                      {" "}
                      (≈ {sugestao.embalagens} {sugestao.label})
                    </span>
                  )}
                  {item.observacaoCompra && (
                    <span className="text-amber-700"> — {item.observacaoCompra}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {linksInternos && (
            <p className="text-xs text-amber-700 mt-2">
              Cadastre um fornecedor para esses produtos em{" "}
              <Link href="/fornecedores" className="underline">
                Fornecedores
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
