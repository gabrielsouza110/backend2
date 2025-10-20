-- CreateEnum
CREATE TYPE "public"."ModalidadeEnum" AS ENUM ('FUTSAL', 'VOLEI', 'BASQUETE', 'HANDBALL');

-- CreateEnum
CREATE TYPE "public"."GeneroModalidade" AS ENUM ('Masculino', 'Feminino', 'Misto');

-- CreateEnum
CREATE TYPE "public"."StatusJogo" AS ENUM ('AGENDADO', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."TipoEvento" AS ENUM ('GOL', 'ASSISTENCIA', 'CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SUBSTITUICAO', 'LESAO', 'FALTA', 'PENALTI', 'FALTA_GRAVE', 'FALTA_GRAVISSIMA', 'IMPEDIMENTO', 'MAO_BOLA', 'ESCANTIO', 'LATERAL', 'TIRO_META', 'TIRO_LIVRE', 'GOL_CONTRA', 'GOL_DE_PENALTI', 'GOL_DE_FALTA', 'GOL_DE_ESQUINA', 'GOL_DE_LATERAL', 'GOL_DE_TIRO_DE_META', 'GOL_DE_TIRO_LIVRE', 'OUTRO');

-- CreateTable
CREATE TABLE "public"."edicoes" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "edicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modalidades" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" "public"."ModalidadeEnum" NOT NULL,
    "icone" VARCHAR(255),
    "descricao" TEXT,
    "genero" "public"."GeneroModalidade" NOT NULL DEFAULT 'Masculino',

    CONSTRAINT "modalidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."turmas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "edicaoId" INTEGER,
    "serie" INTEGER NOT NULL,
    "turno" VARCHAR(20) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'admin_turma',
    "turmaId" INTEGER,
    "ultimoLogin" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notificacoes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."times" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "corUniforme" VARCHAR(7),
    "edicaoId" INTEGER NOT NULL,
    "modalidadeId" INTEGER NOT NULL,

    CONSTRAINT "times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jogadores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "edicaoId" INTEGER,
    "turmaId" INTEGER,
    "numeroCamisa" INTEGER,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_jogador" (
    "id" SERIAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "capitao" BOOLEAN NOT NULL DEFAULT false,
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSaida" TIMESTAMP(3),
    "jogadorId" INTEGER NOT NULL,
    "numeroCamisa" INTEGER,
    "posicao" VARCHAR(50),
    "timeId" INTEGER NOT NULL,

    CONSTRAINT "time_jogador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jogador_modalidade" (
    "id" SERIAL NOT NULL,
    "jogadorId" INTEGER NOT NULL,
    "modalidadeId" INTEGER NOT NULL,

    CONSTRAINT "jogador_modalidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jogos" (
    "id" SERIAL NOT NULL,
    "local" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "edicaoId" INTEGER,
    "modalidadeId" INTEGER NOT NULL,
    "status" "public"."StatusJogo" NOT NULL DEFAULT 'AGENDADO',
    "time1Id" INTEGER NOT NULL,
    "time2Id" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jogos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jogo_times" (
    "id" SERIAL NOT NULL,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "derrota" BOOLEAN NOT NULL DEFAULT false,
    "empate" BOOLEAN NOT NULL DEFAULT false,
    "jogoId" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,
    "vitoria" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "jogo_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evento_jogo" (
    "id" SERIAL NOT NULL,
    "jogoId" INTEGER NOT NULL,
    "tipo" "public"."TipoEvento" NOT NULL,
    "minuto" INTEGER NOT NULL,
    "descricao" VARCHAR(255),
    "timeId" INTEGER NOT NULL,
    "jogadorId" INTEGER,
    "jogadorSubstituidoId" INTEGER,
    "metadados" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estatistica_time" (
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "empates" INTEGER NOT NULL DEFAULT 0,
    "derrotas" INTEGER NOT NULL DEFAULT 0,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "golsContra" INTEGER NOT NULL DEFAULT 0,
    "golsPro" INTEGER NOT NULL DEFAULT 0,
    "modalidadeId" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,

    CONSTRAINT "estatistica_time_pkey" PRIMARY KEY ("timeId","modalidadeId")
);

-- CreateTable
CREATE TABLE "public"."estatistica_jogador" (
    "id" SERIAL NOT NULL,
    "jogadorId" INTEGER NOT NULL,
    "modalidadeId" INTEGER NOT NULL,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "assistencias" INTEGER NOT NULL DEFAULT 0,
    "cartoesAmarelos" INTEGER NOT NULL DEFAULT 0,
    "cartoesVermelhos" INTEGER NOT NULL DEFAULT 0,
    "jogos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estatistica_jogador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."turma_times" (
    "id" SERIAL NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "edicoes_ano_key" ON "public"."edicoes"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "modalidades_tipo_key" ON "public"."modalidades"("tipo");

-- CreateIndex
CREATE INDEX "idx_turmas_edicao" ON "public"."turmas"("edicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_nome_edicaoId_key" ON "public"."turmas"("nome", "edicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuarios_turma" ON "public"."usuarios"("turmaId");

-- CreateIndex
CREATE INDEX "idx_notificacoes_usuario" ON "public"."notificacoes"("usuarioId");

-- CreateIndex
CREATE INDEX "idx_times_edicao" ON "public"."times"("edicaoId");

-- CreateIndex
CREATE INDEX "idx_times_modalidade" ON "public"."times"("modalidadeId");

-- CreateIndex
CREATE INDEX "idx_jogadores_edicao" ON "public"."jogadores"("edicaoId");

-- CreateIndex
CREATE INDEX "idx_jogadores_turma" ON "public"."jogadores"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_nome_turmaId_edicaoId_key" ON "public"."jogadores"("nome", "turmaId", "edicaoId");

-- CreateIndex
CREATE INDEX "idx_time_jogador_jogador_id" ON "public"."time_jogador"("jogadorId");

-- CreateIndex
CREATE UNIQUE INDEX "time_jogador_timeId_jogadorId_key" ON "public"."time_jogador"("timeId", "jogadorId");

-- CreateIndex
CREATE INDEX "idx_jogador_modalidade" ON "public"."jogador_modalidade"("modalidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "jogador_modalidade_jogadorId_modalidadeId_key" ON "public"."jogador_modalidade"("jogadorId", "modalidadeId");

-- CreateIndex
CREATE INDEX "jogos_modalidadeId_idx" ON "public"."jogos"("modalidadeId");

-- CreateIndex
CREATE INDEX "jogos_time1Id_idx" ON "public"."jogos"("time1Id");

-- CreateIndex
CREATE INDEX "jogos_time2Id_idx" ON "public"."jogos"("time2Id");

-- CreateIndex
CREATE INDEX "jogos_dataHora_idx" ON "public"."jogos"("dataHora");

-- CreateIndex
CREATE INDEX "idx_jogos_edicao" ON "public"."jogos"("edicaoId");

-- CreateIndex
CREATE INDEX "idx_jogo_times_jogo" ON "public"."jogo_times"("jogoId");

-- CreateIndex
CREATE INDEX "idx_jogo_times_time" ON "public"."jogo_times"("timeId");

-- CreateIndex
CREATE INDEX "evento_jogo_jogoId_idx" ON "public"."evento_jogo"("jogoId");

-- CreateIndex
CREATE INDEX "evento_jogo_timeId_idx" ON "public"."evento_jogo"("timeId");

-- CreateIndex
CREATE INDEX "evento_jogo_jogadorId_idx" ON "public"."evento_jogo"("jogadorId");

-- CreateIndex
CREATE INDEX "evento_jogo_jogadorSubstituidoId_idx" ON "public"."evento_jogo"("jogadorSubstituidoId");

-- CreateIndex
CREATE INDEX "evento_jogo_tipo_idx" ON "public"."evento_jogo"("tipo");

-- CreateIndex
CREATE INDEX "evento_jogo_minuto_idx" ON "public"."evento_jogo"("minuto");

-- CreateIndex
CREATE INDEX "idx_estatistica_time_modalidade" ON "public"."estatistica_time"("modalidadeId");

-- CreateIndex
CREATE INDEX "idx_estatistica_jogador_modalidade" ON "public"."estatistica_jogador"("modalidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "estatistica_jogador_jogadorId_modalidadeId_key" ON "public"."estatistica_jogador"("jogadorId", "modalidadeId");

-- CreateIndex
CREATE INDEX "idx_turma_time_turma" ON "public"."turma_times"("turmaId");

-- CreateIndex
CREATE INDEX "idx_turma_time_time" ON "public"."turma_times"("timeId");

-- CreateIndex
CREATE UNIQUE INDEX "turma_times_turmaId_timeId_key" ON "public"."turma_times"("turmaId", "timeId");

-- AddForeignKey
ALTER TABLE "public"."turmas" ADD CONSTRAINT "turmas_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "public"."edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."times" ADD CONSTRAINT "times_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "public"."edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."times" ADD CONSTRAINT "times_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "public"."modalidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogadores" ADD CONSTRAINT "jogadores_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "public"."edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogadores" ADD CONSTRAINT "jogadores_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_jogador" ADD CONSTRAINT "time_jogador_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "public"."jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_jogador" ADD CONSTRAINT "time_jogador_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "public"."times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogador_modalidade" ADD CONSTRAINT "jogador_modalidade_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "public"."jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogador_modalidade" ADD CONSTRAINT "jogador_modalidade_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "public"."modalidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogos" ADD CONSTRAINT "jogos_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "public"."edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogos" ADD CONSTRAINT "jogos_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "public"."modalidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogos" ADD CONSTRAINT "jogos_time1Id_fkey" FOREIGN KEY ("time1Id") REFERENCES "public"."times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogos" ADD CONSTRAINT "jogos_time2Id_fkey" FOREIGN KEY ("time2Id") REFERENCES "public"."times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogo_times" ADD CONSTRAINT "jogo_times_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "public"."jogos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jogo_times" ADD CONSTRAINT "jogo_times_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "public"."times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evento_jogo" ADD CONSTRAINT "evento_jogo_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "public"."jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evento_jogo" ADD CONSTRAINT "evento_jogo_jogadorSubstituidoId_fkey" FOREIGN KEY ("jogadorSubstituidoId") REFERENCES "public"."jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evento_jogo" ADD CONSTRAINT "evento_jogo_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "public"."jogos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evento_jogo" ADD CONSTRAINT "evento_jogo_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "public"."times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estatistica_time" ADD CONSTRAINT "estatistica_time_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "public"."modalidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estatistica_time" ADD CONSTRAINT "estatistica_time_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "public"."times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estatistica_jogador" ADD CONSTRAINT "estatistica_jogador_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "public"."jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estatistica_jogador" ADD CONSTRAINT "estatistica_jogador_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "public"."modalidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."turma_times" ADD CONSTRAINT "turma_times_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."turma_times" ADD CONSTRAINT "turma_times_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "public"."times"("id") ON DELETE CASCADE ON UPDATE CASCADE;
