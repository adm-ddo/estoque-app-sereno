-- O vínculo Usuario -> Restaurante já foi migrado para a tabela
-- UsuarioRestaurante (ver migration usuario_restaurante_join + o script
-- scripts/backfill-usuario-restaurante.ts, já rodado e validado). Esta
-- coluna direta não é mais necessária.
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_restauranteId_fkey";
ALTER TABLE "Usuario" DROP COLUMN "restauranteId";

-- Renomeia o campo de "empresa sendo visualizada agora" na sessão: hoje só
-- usado pela impersonação do master, passa a servir também a troca de
-- empresa de um usuário comum com várias empresas.
ALTER TABLE "Sessao" RENAME COLUMN "impersonandoRestauranteId" TO "restauranteAtivoId";
ALTER TABLE "Sessao" RENAME CONSTRAINT "Sessao_impersonandoRestauranteId_fkey" TO "Sessao_restauranteAtivoId_fkey";
