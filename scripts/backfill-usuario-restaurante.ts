import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const usuarios = await prisma.usuario.findMany({
    where: { restauranteId: { not: null } },
    select: { id: true, restauranteId: true, email: true },
  });

  console.log(`Encontrados ${usuarios.length} usuário(s) com restauranteId direto.`);

  let criados = 0;
  let jaExistiam = 0;

  for (const u of usuarios) {
    const existente = await prisma.usuarioRestaurante.findUnique({
      where: {
        usuarioId_restauranteId: {
          usuarioId: u.id,
          restauranteId: u.restauranteId!,
        },
      },
    });
    if (existente) {
      jaExistiam++;
      continue;
    }
    await prisma.usuarioRestaurante.create({
      data: { usuarioId: u.id, restauranteId: u.restauranteId! },
    });
    console.log(`Vinculado: ${u.email} -> restaurante ${u.restauranteId}`);
    criados++;
  }

  console.log(`Concluído. Criados: ${criados}, já existiam: ${jaExistiam}.`);

  const totalVinculos = await prisma.usuarioRestaurante.count();
  console.log(`Total de vínculos UsuarioRestaurante agora: ${totalVinculos}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
