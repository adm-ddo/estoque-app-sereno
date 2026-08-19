-- CreateTable
CREATE TABLE "UsuarioRestaurante" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "restauranteId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioRestaurante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioRestaurante_usuarioId_restauranteId_key" ON "UsuarioRestaurante"("usuarioId", "restauranteId");

-- AddForeignKey
ALTER TABLE "UsuarioRestaurante" ADD CONSTRAINT "UsuarioRestaurante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRestaurante" ADD CONSTRAINT "UsuarioRestaurante_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
