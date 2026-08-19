"use client";

import { useFormStatus } from "react-dom";

/** Componente cliente separado só pra poder usar useFormStatus — precisa
 * estar dentro do <form>, mas o form em si (ContagemFormFields) é server
 * component. Desabilita o botão assim que o envio começa, pra evitar duplo
 * clique/toque numa conexão lenta criar duas Ordens de Compra. */
export default function BotaoSubmitContagem({
  pedidoRapido = false,
}: {
  pedidoRapido?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold py-3.5 transition-colors disabled:opacity-60"
    >
      {pending
        ? "Enviando..."
        : pedidoRapido
          ? "Montar pedido"
          : "Calcular lista de compras"}
    </button>
  );
}
