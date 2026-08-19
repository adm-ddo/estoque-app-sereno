ALTER TABLE "Usuario" ADD COLUMN "nomeCompleto" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "cpf" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "telefone" TEXT;
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");
