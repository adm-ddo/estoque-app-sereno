ALTER TABLE "Produto" ADD COLUMN "pedidoDireto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contagem" ADD COLUMN "pedidoDireto" BOOLEAN NOT NULL DEFAULT false;

-- Preserva o comportamento atual: produtos e contagens de Hortifrúti já
-- eram tratados como pedido direto (sem estoque regulador) antes desse
-- campo existir por categoria fixa — agora vira uma opção por produto.
UPDATE "Produto" SET "pedidoDireto" = true WHERE "local" = 'HORTIFRUTI';
UPDATE "Contagem" SET "pedidoDireto" = true WHERE "local" = 'HORTIFRUTI';
