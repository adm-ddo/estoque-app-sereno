ALTER TABLE "Produto" ADD COLUMN "liberadoTodoDia" BOOLEAN NOT NULL DEFAULT false;

-- Pedido direto deixa de ser um escopo/tela separada e volta a viver na
-- mesma Ordem de Compra normal (a diferenciação passa a ser só por item,
-- via Produto.pedidoDireto). O histórico das Contagens já criadas não é
-- afetado — só paramos de gravar/ler esse campo.
ALTER TABLE "Contagem" DROP COLUMN "pedidoDireto";
