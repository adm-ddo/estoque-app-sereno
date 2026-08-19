"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { AnaliseProduto } from "@/lib/analise-consumo";
import { formatarDataCurta } from "@/lib/data";

const COR_CONSUMO = "#059669"; // emerald-600
const COR_MEDIA = "#a8a29e"; // stone-400
const COR_ALERTA = "#f59e0b"; // amber-500

function formatarData(iso: string): string {
  return formatarDataCurta(new Date(iso));
}

export default function ConsumoChart({ analise }: { analise: AnaliseProduto }) {
  const dados = analise.pontos
    .filter((p) => p.consumoEstimado !== null)
    .map((p) => ({
      data: p.data.toISOString(),
      consumo: p.inconsistente ? null : p.consumoEstimado,
      ultima: p.contagemId === analise.pontos[analise.pontos.length - 1]?.contagemId,
    }));

  if (dados.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Ainda não há semanas suficientes pra montar o gráfico deste produto.
      </p>
    );
  }

  return (
    <div>
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="data"
              tickFormatter={formatarData}
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={{ stroke: "#e7e5e4" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value) => [`${value} ${analise.unidade}`, "Consumo"]}
              labelFormatter={(label) => formatarData(String(label))}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            {analise.mediaConsumo !== null && (
              <ReferenceLine
                y={analise.mediaConsumo}
                stroke={COR_MEDIA}
                strokeDasharray="4 4"
                strokeWidth={2}
              />
            )}
            <Line
              type="monotone"
              dataKey="consumo"
              stroke={COR_CONSUMO}
              strokeWidth={2}
              connectNulls
              dot={(props) => {
                const emUltima = dados[props.index]?.ultima && analise.alerta;
                return (
                  <circle
                    key={props.key}
                    cx={props.cx}
                    cy={props.cy}
                    r={emUltima ? 5 : 3}
                    fill={emUltima ? COR_ALERTA : COR_CONSUMO}
                    stroke="none"
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-stone-500 mt-1">
        <span style={{ color: COR_CONSUMO }}>●</span> Consumo semanal ·{" "}
        <span style={{ color: COR_MEDIA }}>- -</span> Média
        {analise.alerta && (
          <>
            {" · "}
            <span style={{ color: COR_ALERTA }}>●</span> Fora do padrão
          </>
        )}
      </p>
    </div>
  );
}
