-- "Pode pedir qualquer dia" vira "Pedido Rápido": não é só um bypass de
-- ciclo, é o flag que tira o produto da Ordem de Compra semanal normal e
-- coloca ele numa tela separada, dedicada a pedidos fora do ritmo semanal
-- (Hortifrúti, ou qualquer item de reposição frequente tipo salmão numa
-- sushi house). Continua totalmente independente de Produto.pedidoDireto,
-- que só controla o tipo de campo (quantidade direta vs contagem normal).
ALTER TABLE "Produto" RENAME COLUMN "liberadoTodoDia" TO "pedidoRapido";

ALTER TABLE "Contagem" ADD COLUMN "pedidoRapido" BOOLEAN NOT NULL DEFAULT false;
