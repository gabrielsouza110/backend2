-- CreateEnum
CREATE TYPE "PeriodoJogo" AS ENUM ('MANHA', 'MEIO_DIA', 'TARDE', 'NOITE');

-- CreateEnum
CREATE TYPE "TipoJogo" AS ENUM ('FASE_GRUPOS', 'SEMIFINAL', 'FINAL');

-- AlterTable
ALTER TABLE "jogos" ADD COLUMN     "gamesTime1" VARCHAR(50) DEFAULT '0,0,0',
ADD COLUMN     "gamesTime2" VARCHAR(50) DEFAULT '0,0,0',
ADD COLUMN     "periodo" "PeriodoJogo",
ADD COLUMN     "setsTime1" VARCHAR(50) DEFAULT '0,0,0',
ADD COLUMN     "setsTime2" VARCHAR(50) DEFAULT '0,0,0',
ADD COLUMN     "tipoJogo" "TipoJogo" NOT NULL DEFAULT 'FASE_GRUPOS';

-- AlterTable
ALTER TABLE "times" ADD COLUMN     "grupo" VARCHAR(10);

-- CreateTable
CREATE TABLE "jogo_pausa" (
    "id" SERIAL NOT NULL,
    "jogoId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),

    CONSTRAINT "jogo_pausa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jogo_pausa_jogoId_idx" ON "jogo_pausa"("jogoId");

-- AddForeignKey
ALTER TABLE "jogo_pausa" ADD CONSTRAINT "jogo_pausa_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
