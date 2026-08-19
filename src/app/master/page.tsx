import { requireMaster } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RestauranteMasterRow from "./RestauranteMasterRow";

const RESTAURANTE_SELECT = {
  id: true,
  nome: true,
  cnpj: true,
  endereco: true,
  _count: {
    select: { produtos: true, fornecedores: true, contagens: true },
  },
} as const;

export default async function MasterPage() {
  await requireMaster();

  const [pessoas, restaurantesSemDono] = await Promise.all([
    prisma.usuario.findMany({
      where: { isMaster: false },
      orderBy: [{ nomeCompleto: "asc" }, { email: "asc" }],
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        empresas: { select: { restaurante: { select: RESTAURANTE_SELECT } } },
      },
    }),
    prisma.restaurante.findMany({
      where: { usuarios: { none: {} } },
      select: RESTAURANTE_SELECT,
    }),
  ]);

  const totalRestaurantes =
    pessoas.reduce((soma, p) => soma + p.empresas.length, 0) +
    restaurantesSemDono.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Painel Master
        </h1>
        <p className="text-stone-600 mt-1 text-sm">
          Todas as pessoas cadastradas e os restaurantes de cada uma. Seu
          login tem acesso total (cadastrar, editar e apagar) a qualquer um
          deles.
        </p>
      </div>

      {totalRestaurantes === 0 && (
        <p className="text-stone-500 text-sm">
          Nenhum restaurante cadastrado ainda.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {pessoas
          .filter((pessoa) => pessoa.empresas.length > 0)
          .map((pessoa) => (
            <li
              key={pessoa.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-stone-800">
                {pessoa.nomeCompleto || pessoa.email}
              </p>
              {pessoa.nomeCompleto && (
                <p className="text-xs text-stone-500">{pessoa.email}</p>
              )}
              <ul className="flex flex-col gap-2 mt-3">
                {pessoa.empresas.map(({ restaurante }) => (
                  <RestauranteMasterRow
                    key={restaurante.id}
                    restaurante={{
                      id: restaurante.id,
                      nome: restaurante.nome,
                      cnpj: restaurante.cnpj,
                      endereco: restaurante.endereco,
                      counts: restaurante._count,
                    }}
                  />
                ))}
              </ul>
            </li>
          ))}
      </ul>

      {restaurantesSemDono.length > 0 && (
        <div>
          <h2 className="font-semibold text-stone-800 mb-2">
            Sem dono vinculado
          </h2>
          <ul className="flex flex-col gap-2">
            {restaurantesSemDono.map((restaurante) => (
              <RestauranteMasterRow
                key={restaurante.id}
                restaurante={{
                  id: restaurante.id,
                  nome: restaurante.nome,
                  cnpj: restaurante.cnpj,
                  endereco: restaurante.endereco,
                  counts: restaurante._count,
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
