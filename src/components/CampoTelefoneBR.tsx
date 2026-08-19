"use client";

import { useState } from "react";

// Número sem código do país tem no máximo 11 dígitos (DDD + celular com 9).
// Só remove o "55" da frente se sobrar mais que isso — evita cortar por
// engano o DDD 55 (Santa Maria/RS) de um número já sem código do país.
function removerPrefixoBrasil(digitos: string): string {
  return digitos.length > 11 && digitos.startsWith("55")
    ? digitos.slice(2)
    : digitos;
}

/** Já assume o Brasil (+55): a pessoa só digita DDD + número (com o 9 na
 * frente, ex: 51992826704) — o "55" vai escondido no valor de verdade que é
 * submetido, igual ao CampoPreco faz com o preço formatado. Se a pessoa
 * colar/digitar o número já com o 55 na frente (hábito de antes), o campo
 * detecta e tira sozinho — nunca duplica o prefixo. */
export default function CampoTelefoneBR({
  name,
  defaultValue,
  className,
  required,
}: {
  name: string;
  defaultValue?: string | null;
  className?: string;
  required?: boolean;
}) {
  const [numero, setNumero] = useState(() =>
    removerPrefixoBrasil((defaultValue ?? "").replace(/\D/g, ""))
  );

  return (
    <div
      className={`flex items-stretch rounded-lg border border-stone-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 ${className ?? ""}`}
    >
      <span className="flex items-center px-2 bg-stone-50 text-stone-500 text-sm border-r border-stone-300 shrink-0">
        🇧🇷 +55
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={numero}
        onChange={(e) =>
          setNumero(removerPrefixoBrasil(e.target.value.replace(/\D/g, "")))
        }
        placeholder="DDD + número, ex: 51992826704"
        required={required}
        className="flex-1 min-w-0 px-2 py-1.5 text-sm focus:outline-none"
      />
      <input type="hidden" name={name} value={numero ? `55${numero}` : ""} />
    </div>
  );
}
