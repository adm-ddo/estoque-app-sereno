-- Coluna nova, opcional por enquanto: será preenchida pelo script de
-- backfill (scripts/backfill-token-contagem.ts) e só depois disso vira
-- obrigatória numa migration seguinte. NULLs não conflitam entre si numa
-- constraint UNIQUE do Postgres, então é seguro criar já com a constraint.
ALTER TABLE "Restaurante" ADD COLUMN "tokenContagem" TEXT;
CREATE UNIQUE INDEX "Restaurante_tokenContagem_key" ON "Restaurante"("tokenContagem");
