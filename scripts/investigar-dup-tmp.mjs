import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const porDocumento = await pool.query(`
  SELECT
    f."restauranteId",
    r.nome as restaurante_nome,
    regexp_replace(f.documento, '\\D', '', 'g') as documento_normalizado,
    array_agg(f.id ORDER BY f."criadoEm") as fornecedor_ids,
    array_agg(f.nome ORDER BY f."criadoEm") as nomes,
    array_agg(f."criadoEm" ORDER BY f."criadoEm") as criados_em
  FROM "Fornecedor" f
  JOIN "Restaurante" r ON r.id = f."restauranteId"
  WHERE regexp_replace(f.documento, '\\D', '', 'g') <> ''
  GROUP BY f."restauranteId", r.nome, regexp_replace(f.documento, '\\D', '', 'g')
  HAVING count(*) > 1
  ORDER BY r.nome
`);

console.log(`=== ${porDocumento.rows.length} grupo(s) de fornecedores duplicados por DOCUMENTO ===\n`);
let totalDuplicados = 0;
let totalComProdutosDosDoisLados = 0;
for (const grupo of porDocumento.rows) {
  console.log(`Loja: ${grupo.restaurante_nome} (id ${grupo.restauranteId}) — documento ${grupo.documento_normalizado}`);
  const contagens = [];
  for (let i = 0; i < grupo.fornecedor_ids.length; i++) {
    const fid = grupo.fornecedor_ids[i];
    const produtos = await pool.query(
      `SELECT count(*) FROM "ProdutoFornecedor" WHERE "fornecedorId" = $1`,
      [fid]
    );
    contagens.push(Number(produtos.rows[0].count));
    console.log(`  - id ${fid}: "${grupo.nomes[i]}" · criado em ${grupo.criados_em[i].toISOString()} · ${produtos.rows[0].count} produto(s)`);
  }
  totalDuplicados += grupo.fornecedor_ids.length - 1;
  const comProdutos = contagens.filter((c) => c > 0).length;
  if (comProdutos > 1) totalComProdutosDosDoisLados++;
  console.log('');
}

console.log(`\n=== RESUMO ===`);
console.log(`Total de grupos duplicados: ${porDocumento.rows.length}`);
console.log(`Total de fornecedores a apagar (após unificação): ${totalDuplicados}`);
console.log(`Grupos com produtos reais em mais de um lado (precisa migrar): ${totalComProdutosDosDoisLados}`);

await pool.end();
