import { LOCAIS_ORDEM, LOCAL_INFO, type LocalArmazenamento } from "@/lib/locais";
import ContagemInput from "./ContagemInput";
import BotaoSubmitContagem from "./BotaoSubmitContagem";

type Produto = {
  id: number;
  nome: string;
  unidade: string;
  estoqueRegulador: number;
  local: LocalArmazenamento;
  /** Sem estoque regulador confiável (ex: item de embalagem grande que não
   * dá pra fracionar) — a pessoa escreve direto a quantidade que quer
   * pedir, sem calcular déficit nenhum. Convive na mesma lista com os
   * produtos normais. */
  pedidoDireto?: boolean;
  /** Preenchido quando está reeditando uma contagem já feita — pré-popula
   * o campo com o valor contado da vez anterior. */
  quantidadeInicial?: number | null;
  /** Frequência mais longa que o normal desse fluxo (ex: item semanal
   * dentro do pedido diário) — só estilo, deixa o card em destaque. */
  destacarAtencao?: boolean;
  /** Já foi contado dentro do próprio ciclo — começa travado com esse
   * aviso em vez do campo normal, até a pessoa confirmar que quer mesmo
   * contar de novo. */
  avisoCiclo?: string | null;
};

export default function ContagemFormFields({
  produtos,
  action,
  pedidoRapido = false,
}: {
  produtos: Produto[];
  action: (formData: FormData) => void | Promise<void>;
  /** Tela do Pedido Rápido (fora do ritmo semanal normal) — só muda o
   * texto do botão de envio; cada item continua decidindo por conta
   * própria (via `produto.pedidoDireto`) se o campo é quantidade direta
   * ou contagem normal. */
  pedidoRapido?: boolean;
}) {
  const grupos = LOCAIS_ORDEM.map((local) => ({
    local,
    produtos: produtos.filter((p) => p.local === local),
  })).filter((g) => g.produtos.length > 0);

  return (
    <form action={action} className="flex flex-col gap-6 pb-24">
      {grupos.map((grupo) => {
        const info = LOCAL_INFO[grupo.local];
        return (
          <section key={grupo.local} className="flex flex-col gap-3">
            <h2
              className={`text-sm font-semibold uppercase tracking-wide ${info.header} flex items-center gap-1.5`}
            >
              <span className="text-base">{info.emoji}</span>
              {info.label}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {grupo.produtos.map((produto) => (
                <div
                  key={produto.id}
                  className={`rounded-2xl border p-3 shadow-sm flex items-center justify-between gap-3 flex-wrap ${
                    produto.destacarAtencao
                      ? "border-red-300 bg-red-50"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`font-medium text-base leading-tight flex items-center gap-1.5 flex-wrap ${
                        produto.destacarAtencao ? "text-red-700" : "text-stone-800"
                      }`}
                    >
                      {produto.nome}
                      {produto.pedidoDireto && (
                        <span className="text-xs font-normal rounded-full bg-lime-100 text-lime-700 border border-lime-200 px-1.5 py-0.5">
                          pedido direto
                        </span>
                      )}
                    </p>
                    {produto.pedidoDireto ? (
                      <p className="text-xs text-stone-500 mt-0.5">
                        Quanto você quer pedir (sem regulador)
                      </p>
                    ) : (
                      <p className="text-xs text-stone-500 mt-0.5">
                        Regulador: {produto.estoqueRegulador} {produto.unidade}
                      </p>
                    )}
                  </div>
                  <ContagemInput
                    name={`quantidade-${produto.id}`}
                    unidade={produto.unidade}
                    valorInicial={produto.quantidadeInicial}
                    avisoTexto={produto.avisoCiclo}
                    pedidoDireto={produto.pedidoDireto}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="fixed bottom-0 left-0 right-0 border-t border-stone-200 bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-5xl">
          <BotaoSubmitContagem pedidoRapido={pedidoRapido} />
        </div>
      </div>
    </form>
  );
}
