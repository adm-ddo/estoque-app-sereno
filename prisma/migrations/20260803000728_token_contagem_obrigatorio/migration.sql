-- Seguro só depois do backfill (scripts/backfill-token-contagem.ts) já ter
-- rodado e garantido que nenhuma linha tem tokenContagem nulo.
ALTER TABLE "Restaurante" ALTER COLUMN "tokenContagem" SET NOT NULL;
