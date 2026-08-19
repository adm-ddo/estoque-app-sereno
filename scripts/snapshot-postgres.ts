import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const TABELAS = [
  "Restaurante",
  "Usuario",
  "UsuarioRestaurante",
  "Sessao",
  "Produto",
  "Fornecedor",
  "ProdutoFornecedor",
  "Contagem",
  "ContagemItem",
];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const snapshot: Record<string, unknown> = {
    criadoEm: new Date().toISOString(),
  };

  for (const tabela of TABELAS) {
    try {
      const res = await pool.query(`SELECT * FROM "${tabela}"`);
      snapshot[tabela] = res.rows;
    } catch (err) {
      // Tabela pode não existir ainda nessa versão do banco (ex: rodando
      // antes da migration que a cria) — registra e segue.
      snapshot[tabela] = { erro: (err as Error).message };
    }
  }

  mkdirSync("backups", { recursive: true });
  const arquivo = path.join(
    "backups",
    `postgres-snapshot-${(snapshot.criadoEm as string).replace(/[:.]/g, "-")}.json`
  );
  writeFileSync(
    arquivo,
    JSON.stringify(
      snapshot,
      (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    )
  );

  console.log(`Snapshot salvo em ${arquivo}`);
  for (const tabela of TABELAS) {
    const valor = snapshot[tabela];
    console.log(
      `  ${tabela}: ${Array.isArray(valor) ? valor.length + " linhas" : "erro/indisponível"}`
    );
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
