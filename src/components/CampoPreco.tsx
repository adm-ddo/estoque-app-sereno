"use client";

import { useEffect, useState } from "react";

/** Campo de preço em reais que formata a vírgula automaticamente enquanto
 * digita, como uma calculadora (dígitos entram pela direita, viram
 * centavos). O valor de verdade vai num input escondido, já no formato que
 * o servidor espera (ponto decimal), pra não precisar mudar nada lá. */
export default function CampoPreco({
  name,
  defaultValue,
  className,
  placeholder = "0,00",
  onChangeValor,
  required,
}: {
  name: string;
  defaultValue?: number | null;
  className?: string;
  placeholder?: string;
  /** Chamado com o valor numérico atual sempre que ele muda (inclusive no
   * carregamento inicial) — útil quando outro campo precisa reagir a esse
   * valor, ex: calcular o preço por unidade a partir do preço da embalagem. */
  onChangeValor?: (valor: number | null) => void;
  /** O valor de verdade vai num input hidden, que o navegador não valida —
   * por isso o required precisa ficar no input visível mesmo. */
  required?: boolean;
}) {
  const [centavos, setCentavos] = useState<string>(
    defaultValue != null && defaultValue > 0
      ? String(Math.round(defaultValue * 100))
      : ""
  );

  const valorNumerico = centavos ? Number(centavos) / 100 : null;

  useEffect(() => {
    onChangeValor?.(valorNumerico);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorNumerico]);
  const exibicao =
    valorNumerico != null
      ? valorNumerico.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "";

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const apenasDigitos = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setCentavos(apenasDigitos);
  }

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        value={exibicao}
        onChange={aoDigitar}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      <input type="hidden" name={name} value={valorNumerico ?? ""} />
    </>
  );
}
