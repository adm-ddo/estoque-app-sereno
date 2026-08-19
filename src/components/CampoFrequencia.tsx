import { OPCOES_FREQUENCIA_ESTOQUE, formatarDias } from "@/lib/frequencia";

export default function CampoFrequencia({
  frequenciaPadraoDias,
  defaultValue,
  className,
}: {
  frequenciaPadraoDias: number;
  defaultValue?: number | null;
  className?: string;
}) {
  return (
    <select
      name="frequenciaEstoqueDias"
      defaultValue={defaultValue ?? ""}
      className={className}
    >
      <option value="">
        Padrão da loja ({formatarDias(frequenciaPadraoDias)})
      </option>
      {OPCOES_FREQUENCIA_ESTOQUE.map((opcao) => (
        <option key={opcao.dias} value={opcao.dias}>
          {opcao.label} ({formatarDias(opcao.dias)})
        </option>
      ))}
    </select>
  );
}
