import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/auth";
import { formatarDataHora, formatarHora } from "@/lib/data";
import { buscarContagemHojeMesmoEscopo, LIMIAR_SUGERIR_NOVA_HORAS } from "@/lib/contagem";
import { LOCAIS_COM_ORDEM_PROPRIA, LOCAL_INFO, type LocalArmazenamento } from "@/lib/locais";
import AjudaTela from "@/components/AjudaTela";
import BotaoNovaContagem from "@/components/BotaoNovaContagem";
import ContagemHistoricoRow from "./ContagemHistoricoRow";

/** Classe do botão de cada categoria com Ordem de Compra própria — reusa a
 * mesma cor que já identifica a categoria em LOCAL_INFO, só que em formato
 * de botão em vez de badge. */
const BOTAO_CATEGORIA_CLASSE: Partial<Record<LocalArmazenamento, string>> = {
  BEBIDAS:
    "rounded-lg border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 text-sm px-4 py-2 font-medium transition-colors",
  EMBALAGENS:
    "rounded-lg border border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 text-sm px-4 py-2 font-medium transition-colors",
};

export default async function ContagemPage() {
  const sessao = await requireTenant();
  const restauranteId = sessao.restauranteEfetivoId;

  const [contagens, temPedidoRapido, contagemHojeCompleta, contagemHojeRapido, categoriasProprias] =
    await Promise.all([
      prisma.contagem.findMany({
        where: { restauranteId },
        orderBy: { data: "desc" },
        take: 20,
        select: {
          id: true,
          data: true,
          _count: { select: { itens: true } },
        },
      }),
      prisma.produto.count({ where: { restauranteId, pedidoRapido: true } }),
      buscarContagemHojeMesmoEscopo(restauranteId, null),
      buscarContagemHojeMesmoEscopo(restauranteId, null, true),
      Promise.all(
        LOCAIS_COM_ORDEM_PROPRIA.map(async (local) => {
          const [temProdutos, contagemHoje] = await Promise.all([
            prisma.produto.count({ where: { restauranteId, local, pedidoRapido: false } }),
            buscarContagemHojeMesmoEscopo(restauranteId, local),
          ]);
          return { local, temProdutos, contagemHoje };
        })
      ),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">
            Ordem de Compra
          </h1>
          <p className="text-stone-600 mt-1 text-sm">
            Histórico de contagens — cada contagem vira uma nova Ordem de
            Compra.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {temPedidoRapido > 0 && (
            <BotaoNovaContagem
              hrefNova="/contagem/nova?rapido=1"
              hrefEditar={
                contagemHojeRapido
                  ? `/contagem/nova?rapido=1&editar=${contagemHojeRapido.id}`
                  : null
              }
              horaExistente={
                contagemHojeRapido ? formatarHora(contagemHojeRapido.data) : null
              }
              sugerirNova={
                (contagemHojeRapido?.horasAtras ?? 0) > LIMIAR_SUGERIR_NOVA_HORAS
              }
              label="⚡ Pedido Rápido"
              className="rounded-lg border border-lime-300 bg-lime-50 text-lime-800 hover:bg-lime-100 text-sm px-4 py-2 font-medium transition-colors"
            />
          )}
          {categoriasProprias.map(({ local, temProdutos, contagemHoje }) =>
            temProdutos > 0 ? (
              <BotaoNovaContagem
                key={local}
                hrefNova={`/contagem/nova?local=${local}`}
                hrefEditar={
                  contagemHoje ? `/contagem/nova?local=${local}&editar=${contagemHoje.id}` : null
                }
                horaExistente={contagemHoje ? formatarHora(contagemHoje.data) : null}
                sugerirNova={(contagemHoje?.horasAtras ?? 0) > LIMIAR_SUGERIR_NOVA_HORAS}
                label={`${LOCAL_INFO[local].emoji} ${LOCAL_INFO[local].label}`}
                className={BOTAO_CATEGORIA_CLASSE[local] ?? ""}
              />
            ) : null
          )}
          <BotaoNovaContagem
            hrefNova="/contagem/nova"
            hrefEditar={
              contagemHojeCompleta ? `/contagem/nova?editar=${contagemHojeCompleta.id}` : null
            }
            horaExistente={
              contagemHojeCompleta ? formatarHora(contagemHojeCompleta.data) : null
            }
            sugerirNova={(contagemHojeCompleta?.horasAtras ?? 0) > LIMIAR_SUGERIR_NOVA_HORAS}
            label="Nova Ordem de Compra"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 font-medium transition-colors"
          />
        </div>
      </div>

      <AjudaTela>
        <p>
          É aqui que a mágica acontece! Seu time faz a contagem de tudo que
          tem na loja e o sistema já monta a Ordem de Compra sozinho,
          separada por fornecedor e pronta pra mandar no WhatsApp.
        </p>
        <p>
          Cada contagem vira uma nova Ordem de Compra — clique em{" "}
          <strong>Nova Ordem de Compra</strong> pra começar uma. Você fica
          SERENO sabendo exatamente o que falta.
        </p>
        <p>
          Se já tiver uma contagem feita hoje, o sistema pergunta se você
          quer editar ela em vez de criar outra — evita Ordem de Compra
          duplicada sem querer.
        </p>
        {temPedidoRapido > 0 && (
          <p>
            Tem produtos marcados como <strong>Pedido Rápido</strong>{" "}
            (Hortifrúti, ou qualquer item de reposição frequente)? Eles saem
            da Ordem de Compra semanal e ficam só no atalho{" "}
            <strong>⚡ Pedido Rápido</strong>, pra pedir sempre que precisar,
            sem esperar o ritmo semanal.
          </p>
        )}
        {categoriasProprias.some((c) => c.temProdutos > 0) && (
          <p>
            <strong>Bebidas</strong> e <strong>Embalagens</strong> também têm
            Ordem de Compra própria, separada da semanal — assim dá pra
            pedir cada categoria no ritmo que fizer sentido pra ela, sem
            duplicar item entre as duas.
          </p>
        )}
      </AjudaTela>

      <ul className="flex flex-col gap-2">
        {contagens.map((contagem) => (
          <ContagemHistoricoRow
            key={contagem.id}
            contagem={{ id: contagem.id, itensContados: contagem._count.itens }}
            dataFormatada={formatarDataHora(contagem.data)}
            podeExcluir={sessao.isMaster}
          />
        ))}
        {contagens.length === 0 && (
          <p className="text-stone-500 text-sm">
            Nenhuma contagem realizada ainda.
          </p>
        )}
      </ul>
    </div>
  );
}
