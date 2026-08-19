import "dotenv/config";
import Database from "better-sqlite3";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const SQLITE_PATH = process.argv[2] ?? "./dev.db";

async function main() {
  console.log(`Lendo do SQLite: ${SQLITE_PATH}`);
  console.log(`Escrevendo no Postgres apontado por DATABASE_URL`);

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const existentes = await prisma.restaurante.count();
  if (existentes > 0) {
    throw new Error(
      `O banco de destino já tem ${existentes} restaurante(s). Abortando pra não duplicar/misturar dados. Use um banco vazio.`
    );
  }

  const restaurantes = sqlite.prepare("SELECT * FROM Restaurante").all() as any[];
  const usuarios = sqlite.prepare("SELECT * FROM Usuario").all() as any[];
  const produtos = sqlite.prepare("SELECT * FROM Produto").all() as any[];
  const fornecedores = sqlite.prepare("SELECT * FROM Fornecedor").all() as any[];
  const produtoFornecedor = sqlite
    .prepare("SELECT * FROM ProdutoFornecedor")
    .all() as any[];
  const contagens = sqlite.prepare("SELECT * FROM Contagem").all() as any[];
  const contagemItens = sqlite.prepare("SELECT * FROM ContagemItem").all() as any[];

  console.log({
    restaurantes: restaurantes.length,
    usuarios: usuarios.length,
    produtos: produtos.length,
    fornecedores: fornecedores.length,
    produtoFornecedor: produtoFornecedor.length,
    contagens: contagens.length,
    contagemItens: contagemItens.length,
  });

  await prisma.$transaction(async (tx) => {
    for (const r of restaurantes) {
      await tx.restaurante.create({
        data: {
          id: r.id,
          nome: r.nome,
          cnpj: r.cnpj,
          endereco: r.endereco,
          logo: r.logo,
          responsavelComprasNome: r.responsavelComprasNome,
          responsavelComprasTelefone: r.responsavelComprasTelefone,
          criadoEm: new Date(r.criadoEm),
        },
      });
    }

    for (const u of usuarios) {
      await tx.usuario.create({
        data: {
          id: u.id,
          email: u.email,
          senhaHash: u.senhaHash,
          isMaster: !!u.isMaster,
          restauranteId: u.restauranteId,
          criadoEm: new Date(u.criadoEm),
        },
      });
    }

    for (const p of produtos) {
      await tx.produto.create({
        data: {
          id: p.id,
          restauranteId: p.restauranteId,
          nome: p.nome,
          unidade: p.unidade,
          estoqueRegulador: p.estoqueRegulador,
          local: p.local,
          criadoEm: new Date(p.criadoEm),
        },
      });
    }

    for (const f of fornecedores) {
      await tx.fornecedor.create({
        data: {
          id: f.id,
          restauranteId: f.restauranteId,
          nome: f.nome,
          documento: f.documento,
          contatoNome: f.contatoNome,
          telefone: f.telefone,
          criadoEm: new Date(f.criadoEm),
        },
      });
    }

    for (const pf of produtoFornecedor) {
      await tx.produtoFornecedor.create({
        data: {
          id: pf.id,
          produtoId: pf.produtoId,
          fornecedorId: pf.fornecedorId,
          preco: pf.preco,
        },
      });
    }

    for (const c of contagens) {
      await tx.contagem.create({
        data: {
          id: c.id,
          restauranteId: c.restauranteId,
          data: new Date(c.data),
          pdfLista: c.pdfLista ? Buffer.from(c.pdfLista) : null,
          pdfGeradoEm: c.pdfGeradoEm ? new Date(c.pdfGeradoEm) : null,
        },
      });
    }

    for (const ci of contagemItens) {
      await tx.contagemItem.create({
        data: {
          id: ci.id,
          contagemId: ci.contagemId,
          produtoId: ci.produtoId,
          quantidadeContada: ci.quantidadeContada,
        },
      });
    }
  });

  // Ajusta as sequências do Postgres pra continuar depois do maior id migrado
  const tabelas = [
    "Restaurante",
    "Usuario",
    "Produto",
    "Fornecedor",
    "ProdutoFornecedor",
    "Contagem",
    "ContagemItem",
  ];
  for (const tabela of tabelas) {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${tabela}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${tabela}"), 1),
        true
      )
    `);
  }

  console.log("Migração concluída com sucesso.");

  await prisma.$disconnect();
  await pool.end();
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
