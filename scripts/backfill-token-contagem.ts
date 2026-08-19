import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { gerarTokenContagem } from "../src/lib/restaurante";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const restaurantes = await prisma.restaurante.findMany({
    where: { tokenContagem: null },
    select: { id: true, nome: true },
  });

  console.log(`Encontrados ${restaurantes.length} restaurante(s) sem token.`);

  for (const r of restaurantes) {
    await prisma.restaurante.update({
      where: { id: r.id },
      data: { tokenContagem: gerarTokenContagem() },
    });
    console.log(`Token gerado: ${r.nome} (id ${r.id})`);
  }

  const restantes = await prisma.restaurante.count({
    where: { tokenContagem: null },
  });
  console.log(`Restaurantes ainda sem token: ${restantes}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
