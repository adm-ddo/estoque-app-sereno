"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMaster, requireSessao, SESSAO_COOKIE } from "@/lib/auth";

/** Acesso total do master a uma empresa: cria/edita/apaga como se fosse a
 * própria empresa, sem restrição — não é um modo "demonstração". */
export async function acessarEmpresa(restauranteId: number) {
  await requireMaster();
  const token = (await cookies()).get(SESSAO_COOKIE)?.value;
  if (!token) redirect("/login");

  await prisma.sessao.update({
    where: { token },
    data: { restauranteAtivoId: restauranteId },
  });
  revalidatePath("/", "layout");
  redirect("/produtos");
}

/** Exclusão de qualquer restaurante pelo master — sem checagem de vínculo,
 * já que o master tem acesso total por definição. Mesma cascata (produtos,
 * fornecedores, contagens) usada em excluirRestaurante (dono). */
export async function excluirRestauranteMaster(restauranteId: number) {
  await requireMaster();
  await prisma.restaurante.delete({ where: { id: restauranteId } });
  revalidatePath("/master");
  revalidatePath("/", "layout");
}

export async function marcarFeedbackLida(id: number, lida: boolean) {
  await requireMaster();
  await prisma.feedback.update({ where: { id }, data: { lida } });
  revalidatePath("/master/feedback");
}

export async function voltarParaMaster() {
  const sessao = await requireSessao();
  if (!sessao.isMaster) redirect("/produtos");

  const token = (await cookies()).get(SESSAO_COOKIE)?.value;
  if (token) {
    await prisma.sessao.update({
      where: { token },
      data: { restauranteAtivoId: null },
    });
  }
  revalidatePath("/", "layout");
  redirect("/master");
}
