import { prisma } from "@/lib/prisma";
import { requireSessao } from "@/lib/auth";
import MeusDadosForm from "./MeusDadosForm";

export default async function MeusDadosPage() {
  const sessao = await requireSessao();
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: sessao.usuarioId },
    select: { nomeCompleto: true, cpf: true, telefone: true, email: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Meus dados</h1>
        <p className="text-stone-600 mt-1 text-sm">
          Seus dados pessoais de login. O CPF é usado pra recuperar a senha
          caso você esqueça.
        </p>
      </div>

      <MeusDadosForm
        nomeCompleto={usuario.nomeCompleto ?? ""}
        cpf={usuario.cpf ?? ""}
        telefone={usuario.telefone ?? ""}
        email={usuario.email}
      />
    </div>
  );
}
