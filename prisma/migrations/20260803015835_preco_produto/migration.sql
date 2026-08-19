ALTER TABLE "Produto" ADD COLUMN "preco" DOUBLE PRECISION;
ALTER TABLE "Produto" ADD COLUMN "precoAtualizadoEm" TIMESTAMP(3);

CREATE TABLE "ProdutoPreco" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProdutoPreco_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProdutoPreco_produtoId_idx" ON "ProdutoPreco"("produtoId");

ALTER TABLE "ProdutoPreco" ADD CONSTRAINT "ProdutoPreco_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
