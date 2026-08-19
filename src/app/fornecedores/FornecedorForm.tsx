"use client";

import { LOCAIS_ORDEM, LOCAL_INFO, LocalArmazenamento } from "@/lib/locais";

type Produto = {
  id: number;
  nome: string;
  unidade: string;
  local: LocalArmazenamento;
};

export default function FornecedorForm({
  produtos,
  defaultNome = "",
  defaultDocumento = "",
  defaultContatoNome = "",
  defaultTelefone = "",
  defaultProdutoIds = [],
}: {
  produtos: Produto[];
  defaultNome?: string;
  defaultDocumento?: string;
  defaultContatoNome?: string;
  defaultTelefone?: string;
  defaultProdutoIds?: number[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">Nome (empresa)</label>
          <input
            name="nome"
            required
            defaultValue={defaultNome}
            placeholder="Ex: Distribuidora ABC"
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">CNPJ ou CPF</label>
          <input
            name="documento"
            required
            defaultValue={defaultDocumento}
            placeholder="Ex: 12.345.678/0001-90"
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">
            Nome do contato/representante
          </label>
          <input
            name="contatoNome"
            defaultValue={defaultContatoNome}
            placeholder="Ex: João (vendedor)"
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500">
            Telefone (opcional, apenas para referência)
          </label>
          <input
            name="telefone"
            defaultValue={defaultTelefone}
            placeholder="Ex: 5511999998888"
            className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <p className="text-xs text-stone-500">
        O pedido é enviado para o grupo do WhatsApp deste fornecedor (você
        escolhe o grupo na hora de enviar). O telefone acima é só para sua
        referência.
      </p>
      <div>
        <label className="text-xs text-stone-500">
          Produtos que este fornecedor vende
        </label>
        <div className="mt-1 flex flex-col gap-2 rounded-lg border border-stone-200 p-2 max-h-56 overflow-y-auto">
          {produtos.length === 0 && (
            <p className="text-sm text-stone-500">
              Cadastre produtos primeiro.
            </p>
          )}
          {LOCAIS_ORDEM.map((local) => {
            const produtosDoLocal = produtos.filter((p) => p.local === local);
            if (produtosDoLocal.length === 0) return null;
            const info = LOCAL_INFO[local];
            return (
              <div key={local}>
                <p
                  className={`text-xs font-medium mb-1 ${info.header}`}
                >
                  {info.emoji} {info.label}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {produtosDoLocal.map((produto) => (
                    <label
                      key={produto.id}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="produtoIds"
                        value={produto.id}
                        defaultChecked={defaultProdutoIds.includes(produto.id)}
                        className="accent-emerald-600"
                      />
                      {produto.nome}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
