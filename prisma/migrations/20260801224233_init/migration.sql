-- CreateEnum
CREATE TYPE "LocalArmazenamento" AS ENUM ('FREEZER', 'GELADEIRA', 'ESTOQUE_SECO', 'EMBALAGENS', 'PRODUTOS_LIMPEZA');

-- CreateTable
CREATE TABLE "Restaurante" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "logo" TEXT,
    "responsavelComprasNome" TEXT,
    "responsavelComprasTelefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "restauranteId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "impersonandoRestauranteId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" SERIAL NOT NULL,
    "restauranteId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "estoqueRegulador" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "local" "LocalArmazenamento" NOT NULL DEFAULT 'ESTOQUE_SECO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "restauranteId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "contatoNome" TEXT,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoFornecedor" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    "preco" DOUBLE PRECISION,

    CONSTRAINT "ProdutoFornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contagem" (
    "id" SERIAL NOT NULL,
    "restauranteId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfLista" BYTEA,
    "pdfGeradoEm" TIMESTAMP(3),

    CONSTRAINT "Contagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContagemItem" (
    "id" SERIAL NOT NULL,
    "contagemId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidadeContada" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ContagemItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_token_key" ON "Sessao"("token");

-- CreateIndex
CREATE INDEX "Produto_restauranteId_idx" ON "Produto"("restauranteId");

-- CreateIndex
CREATE INDEX "Fornecedor_restauranteId_idx" ON "Fornecedor"("restauranteId");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoFornecedor_produtoId_fornecedorId_key" ON "ProdutoFornecedor"("produtoId", "fornecedorId");

-- CreateIndex
CREATE INDEX "Contagem_restauranteId_idx" ON "Contagem"("restauranteId");

-- CreateIndex
CREATE UNIQUE INDEX "ContagemItem_contagemId_produtoId_key" ON "ContagemItem"("contagemId", "produtoId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_impersonandoRestauranteId_fkey" FOREIGN KEY ("impersonandoRestauranteId") REFERENCES "Restaurante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoFornecedor" ADD CONSTRAINT "ProdutoFornecedor_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoFornecedor" ADD CONSTRAINT "ProdutoFornecedor_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contagem" ADD CONSTRAINT "Contagem_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContagemItem" ADD CONSTRAINT "ContagemItem_contagemId_fkey" FOREIGN KEY ("contagemId") REFERENCES "Contagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContagemItem" ADD CONSTRAINT "ContagemItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
