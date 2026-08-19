"use client";

import { useActionState } from "react";
import { atualizarConfiguracoes } from "./actions";
import { OPCOES_FREQUENCIA_ESTOQUE, formatarDias } from "@/lib/frequencia";
import CampoTelefoneBR from "@/components/CampoTelefoneBR";

type Props = {
  nome: string;
  cnpj: string;
  endereco: string;
  logo: string | null;
  responsavelComprasNome: string;
  responsavelComprasTelefone: string;
  responsavelComprasNome2: string;
  responsavelComprasTelefone2: string;
  frequenciaEstoquePadraoDias: number;
};

export default function ConfiguracoesForm(props: Props) {
  const [state, formAction, pending] = useActionState(
    atualizarConfiguracoes,
    undefined
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm max-w-lg"
    >
      <div>
        <h2 className="font-semibold text-stone-800">Dados do restaurante</h2>
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">Nome</label>
            <input
              name="nome"
              required
              defaultValue={props.nome}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">CNPJ</label>
            <input
              name="cnpj"
              required
              defaultValue={props.cnpj}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">Endereço</label>
            <input
              name="endereco"
              required
              defaultValue={props.endereco}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">
              Logo (opcional, até 1,5MB — deixe em branco pra manter a atual)
            </label>
            {props.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.logo}
                alt="Logo atual"
                className="h-12 w-12 rounded-lg object-cover border border-stone-200 mb-1"
              />
            )}
            <input name="logo" type="file" accept="image/*" className="text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">
              Frequência padrão do estoque regulador
            </label>
            <select
              name="frequenciaEstoquePadraoDias"
              defaultValue={props.frequenciaEstoquePadraoDias}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {OPCOES_FREQUENCIA_ESTOQUE.map((opcao) => (
                <option key={opcao.dias} value={opcao.dias}>
                  {opcao.label} ({formatarDias(opcao.dias)})
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500">
              A cada quantos dias você costuma repor o estoque. Vale pra
              todos os produtos, mas dá pra mudar individualmente em Produtos.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-stone-800">
          Responsáveis de compras
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Recebem a lista de compras completa (todos os fornecedores juntos)
          pelo WhatsApp. Pode cadastrar até 2 pessoas.
        </p>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-stone-500 uppercase">
              Responsável 1
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Nome</label>
              <input
                name="responsavelComprasNome"
                defaultValue={props.responsavelComprasNome}
                placeholder="Ex: Maria"
                className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">WhatsApp</label>
              <CampoTelefoneBR
                name="responsavelComprasTelefone"
                defaultValue={props.responsavelComprasTelefone}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-4">
            <p className="text-xs font-medium text-stone-500 uppercase">
              Responsável 2 (opcional)
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Nome</label>
              <input
                name="responsavelComprasNome2"
                defaultValue={props.responsavelComprasNome2}
                placeholder="Ex: João"
                className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">WhatsApp</label>
              <CampoTelefoneBR
                name="responsavelComprasTelefone2"
                defaultValue={props.responsavelComprasTelefone2}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {state?.erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.erro}
        </p>
      )}
      {state?.sucesso && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Configurações salvas.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 disabled:opacity-50 transition-colors"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
