CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "usuarioNome" TEXT,
    "usuarioEmail" TEXT,
    "usuarioTelefone" TEXT,
    "restauranteNome" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
