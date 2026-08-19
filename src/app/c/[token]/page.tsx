import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatarHora } from "@/lib/data";
import { buscarContagemHojeMesmoEscopo, LIMIAR_SUGERIR_NOVA_HORAS } from "@/lib/contagem";
import { LOCAIS_COM_ORDEM_PROPRIA, LOCAL_INFO, type LocalArmazenamento } from "@/lib/locais";
import Logo from "@/components/Logo";
import BotaoNovaContagem from "@/components/BotaoNovaContagem";

/** Classe do botão de cada categoria com Ordem de Compra própria — reusa a
 * mesma cor que já identifica a categoria em LOCAL_INFO, só que em formato
 * de botão em vez de badge. */
const BOTAO_CATEGORIA_CLASSE: Partial<Record<LocalArmazenamento, string>> = {
  BEBIDAS:
    "rounded-xl border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 text-sm font-semibold px-6 py-3 transition-colors",
  EMBALAGENS:
    "rounded-xl border border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 text-sm font-semibold px-6 py-3 transition-colors",
};

export default async function ContagemPublicaLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const restaurante = await prisma.restaurante.findUnique({
    where: { tokenContagem: token },
    select: { id: true, nome: true, logo: true },
  });
  if (!restaurante) notFound();

  const [temPedidoRapido, contagemHojeCompleta, contagemHojeRapido, categoriasProprias] =
    await Promise.all([
      prisma.produto.count({ where: { restauranteId: restaurante.id, pedidoRapido: true } }),
      buscarContagemHojeMesmoEscopo(restaurante.id, null),
      buscarContagemHojeMesmoEscopo(restaurante.id, null, true),
      Promise.all(
        LOCAIS_COM_ORDEM_PROPRIA.map(async (local) => {
          const [temProdutos, contagemHoje] = await Promise.all([
            prisma.produto.count({
              where: { restauranteId: restaurante.id, local, pedidoRapido: false },
            }),
            buscarContagemHojeMesmoEscopo(restaurante.id, local),
          ]);
          return { local, temProdutos, contagemHoje };
        })
      ),
    ]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center py-12">
      {restaurante.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={restaurante.logo}
          alt=""
          className="h-16 w-16 rounded-2xl object-cover border border-stone-200"
        />
      ) : (
        <Logo size={64} />
      )}
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          {restaurante.nome}
        </h1>
        <p className="text-stone-600 mt-1 max-w-xs">
          Contagem semanal de estoque. Confira os itens fisicamente e informe
          a quantidade de cada um.
        </p>
      </div>
      <BotaoNovaContagem
        hrefNova={`/c/${token}/nova`}
        hrefEditar={
          contagemHojeCompleta ? `/c/${token}/nova?editar=${contagemHojeCompleta.id}` : null
        }
        horaExistente={contagemHojeCompleta ? formatarHora(contagemHojeCompleta.data) : null}
        sugerirNova={(contagemHojeCompleta?.horasAtras ?? 0) > LIMIAR_SUGERIR_NOVA_HORAS}
        label="Iniciar Contagem Semanal"
        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold px-8 py-4 transition-colors"
      />
      {temPedidoRapido > 0 && (
        <BotaoNovaContagem
          hrefNova={`/c/${token}/nova?rapido=1`}
          hrefEditar={
            contagemHojeRapido
              ? `/c/${token}/nova?rapido=1&editar=${contagemHojeRapido.id}`
              : null
          }
          horaExistente={
            contagemHojeRapido ? formatarHora(contagemHojeRapido.data) : null
          }
          sugerirNova={(contagemHojeRapido?.horasAtras ?? 0) > LIMIAR_SUGERIR_NOVA_HORAS}
          label="⚡ Pedido Rápido"
          className="rounded-xl border border-lime-300 bg-lime-50 text-lime-800 hover:bg-lime-100 text-sm font-semibold px-6 py-3 transition-colors"
        />
      )}
      {categoriasProprias.map(({ local, temProdutos, contagemHoje }) =>
        temProdutos > 0 ? (
          <BotaoNovaContagem
            key={local}
            hrefNova={`/c/${token}/nova?local=${local}`}
            hrefEditar={
              contagemHoje ? `/c/${token}/nova?local=${local}&editar=${contagemHoje.id}` : null
            }
            horaExistente={contagemHoje ? formatarHora(contagemHoje.data) : null}
            sugerirNova={(contagemHoje?.horasAtras ?? 0) > LIMIAR_SUGERIR_NOVA_HORAS}
            label={`${LOCAL_INFO[local].emoji} ${LOCAL_INFO[local].label}`}
            className={BOTAO_CATEGORIA_CLASSE[local] ?? ""}
          />
        ) : null
      )}
    </div>
  );
}
