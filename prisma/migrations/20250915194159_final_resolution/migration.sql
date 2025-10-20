-- Final resolution migration to make database consistent with our schema
-- This migration will check what exists and create what's missing

-- First, let's handle the enum types
-- Check if GeneroModalidade enum exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GeneroModalidade') THEN
    CREATE TYPE "public"."GeneroModalidade" AS ENUM ('Masculino', 'Feminino', 'Misto');
  END IF;
END $$;

-- Check if ModalidadeEnum enum exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ModalidadeEnum') THEN
    CREATE TYPE "public"."ModalidadeEnum" AS ENUM ('FUTSAL', 'VOLEI', 'BASQUETE', 'HANDBALL');
  END IF;
END $$;

-- Check if StatusJogo enum exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusJogo') THEN
    CREATE TYPE "public"."StatusJogo" AS ENUM ('AGENDADO', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO');
  END IF;
END $$;

-- Check if TipoEvento enum exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoEvento') THEN
    CREATE TYPE "public"."TipoEvento" AS ENUM ('GOL', 'ASSISTENCIA', 'CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SUBSTITUICAO', 'LESAO', 'FALTA', 'PENALTI', 'FALTA_GRAVE', 'FALTA_GRAVISSIMA', 'IMPEDIMENTO', 'MAO_BOLA', 'ESCANTIO', 'LATERAL', 'TIRO_META', 'TIRO_LIVRE', 'GOL_CONTRA', 'GOL_DE_PENALTI', 'GOL_DE_FALTA', 'GOL_DE_ESQUINA', 'GOL_DE_LATERAL', 'GOL_DE_TIRO_DE_META', 'GOL_DE_TIRO_LIVRE', 'OUTRO');
  END IF;
END $$;

-- Now handle tables
-- Create edicoes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'edicoes') THEN
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
  END IF;
END $$;

-- Create modalidades table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modalidades') THEN
    CREATE TABLE "public"."modalidades" (
        "id" SERIAL NOT NULL,
        "nome" VARCHAR(100) NOT NULL,
        "tipo" "public"."ModalidadeEnum" NOT NULL,
        "icone" VARCHAR(255),
        "descricao" TEXT,
        "genero" "public"."GeneroModalidade" NOT NULL DEFAULT 'Masculino',
        CONSTRAINT "modalidades_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Create turmas table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'turmas') THEN
    CREATE TABLE "public"."turmas" (
        "id" SERIAL NOT NULL,
        "nome" VARCHAR(50) NOT NULL,
        "ativa" BOOLEAN NOT NULL DEFAULT true,
        "edicaoId" INTEGER,
        "serie" INTEGER NOT NULL,
        "turno" VARCHAR(20) NOT NULL,
        CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Create usuarios table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
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
  END IF;
END $$;

-- Create notificacoes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notificacoes') THEN
    CREATE TABLE "public"."notificacoes" (
        "id" SERIAL NOT NULL,
        "titulo" VARCHAR(100) NOT NULL,
        "mensagem" TEXT NOT NULL,
        "lida" BOOLEAN NOT NULL DEFAULT false,
        "usuarioId" INTEGER NOT NULL,
        "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Create times table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'times') THEN
    CREATE TABLE "public"."times" (
        "id" SERIAL NOT NULL,
        "nome" VARCHAR(100) NOT NULL,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "corUniforme" VARCHAR(7),
        "edicaoId" INTEGER NOT NULL,
        "modalidadeId" INTEGER NOT NULL,
        CONSTRAINT "times_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Create jogadores table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jogadores') THEN
    CREATE TABLE "public"."jogadores" (
        "id" SERIAL NOT NULL,
        "nome" VARCHAR(100) NOT NULL,
        "edicaoId" INTEGER,
        "turmaId" INTEGER,
        "numeroCamisa" INTEGER,
        CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Create time_jogador table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_jogador') THEN
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
  END IF;
END $$;

-- Create jogador_modalidade table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jogador_modalidade') THEN
    CREATE TABLE "public"."jogador_modalidade" (
        "id" SERIAL NOT NULL,
        "jogadorId" INTEGER NOT NULL,
        "modalidadeId" INTEGER NOT NULL,
        CONSTRAINT "jogador_modalidade_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Create jogos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jogos') THEN
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
  END IF;
END $$;

-- Create jogo_times table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jogo_times') THEN
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
  END IF;
END $$;

-- Create evento_jogo table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evento_jogo') THEN
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
  END IF;
END $$;

-- Create estatistica_time table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estatistica_time') THEN
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
  END IF;
END $$;

-- Create estatistica_jogador table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estatistica_jogador') THEN
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
  END IF;
END $$;

-- Create turma_times table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'turma_times') THEN
    CREATE TABLE "public"."turma_times" (
        "id" SERIAL NOT NULL,
        "turmaId" INTEGER NOT NULL,
        "timeId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "turma_times_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Now handle indexes and constraints
-- Unique constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'edicoes' AND indexname = 'edicoes_ano_key') THEN
    CREATE UNIQUE INDEX "edicoes_ano_key" ON "public"."edicoes"("ano");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'modalidades' AND indexname = 'modalidades_tipo_key') THEN
    CREATE UNIQUE INDEX "modalidades_tipo_key" ON "public"."modalidades"("tipo");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'usuarios' AND indexname = 'usuarios_email_key') THEN
    CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'turmas' AND indexname = 'turmas_nome_edicaoId_key') THEN
    CREATE UNIQUE INDEX "turmas_nome_edicaoId_key" ON "public"."turmas"("nome", "edicaoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogadores' AND indexname = 'jogadores_nome_turmaId_edicaoId_key') THEN
    CREATE UNIQUE INDEX "jogadores_nome_turmaId_edicaoId_key" ON "public"."jogadores"("nome", "turmaId", "edicaoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'time_jogador' AND indexname = 'time_jogador_timeId_jogadorId_key') THEN
    CREATE UNIQUE INDEX "time_jogador_timeId_jogadorId_key" ON "public"."time_jogador"("timeId", "jogadorId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogador_modalidade' AND indexname = 'jogador_modalidade_jogadorId_modalidadeId_key') THEN
    CREATE UNIQUE INDEX "jogador_modalidade_jogadorId_modalidadeId_key" ON "public"."jogador_modalidade"("jogadorId", "modalidadeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'estatistica_jogador' AND indexname = 'estatistica_jogador_jogadorId_modalidadeId_key') THEN
    CREATE UNIQUE INDEX "estatistica_jogador_jogadorId_modalidadeId_key" ON "public"."estatistica_jogador"("jogadorId", "modalidadeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'turma_times' AND indexname = 'turma_times_turmaId_timeId_key') THEN
    CREATE UNIQUE INDEX "turma_times_turmaId_timeId_key" ON "public"."turma_times"("turmaId", "timeId");
  END IF;
END $$;

-- Regular indexes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'turmas' AND indexname = 'idx_turmas_edicao') THEN
    CREATE INDEX "idx_turmas_edicao" ON "public"."turmas"("edicaoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'usuarios' AND indexname = 'idx_usuarios_turma') THEN
    CREATE INDEX "idx_usuarios_turma" ON "public"."usuarios"("turmaId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'notificacoes' AND indexname = 'idx_notificacoes_usuario') THEN
    CREATE INDEX "idx_notificacoes_usuario" ON "public"."notificacoes"("usuarioId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'times' AND indexname = 'idx_times_edicao') THEN
    CREATE INDEX "idx_times_edicao" ON "public"."times"("edicaoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'times' AND indexname = 'idx_times_modalidade') THEN
    CREATE INDEX "idx_times_modalidade" ON "public"."times"("modalidadeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogadores' AND indexname = 'idx_jogadores_edicao') THEN
    CREATE INDEX "idx_jogadores_edicao" ON "public"."jogadores"("edicaoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogadores' AND indexname = 'idx_jogadores_turma') THEN
    CREATE INDEX "idx_jogadores_turma" ON "public"."jogadores"("turmaId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'time_jogador' AND indexname = 'idx_time_jogador_jogador_id') THEN
    CREATE INDEX "idx_time_jogador_jogador_id" ON "public"."time_jogador"("jogadorId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogador_modalidade' AND indexname = 'idx_jogador_modalidade') THEN
    CREATE INDEX "idx_jogador_modalidade" ON "public"."jogador_modalidade"("modalidadeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogos' AND indexname = 'jogos_modalidadeId_idx') THEN
    CREATE INDEX "jogos_modalidadeId_idx" ON "public"."jogos"("modalidadeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogos' AND indexname = 'jogos_time1Id_idx') THEN
    CREATE INDEX "jogos_time1Id_idx" ON "public"."jogos"("time1Id");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogos' AND indexname = 'jogos_time2Id_idx') THEN
    CREATE INDEX "jogos_time2Id_idx" ON "public"."jogos"("time2Id");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogos' AND indexname = 'jogos_dataHora_idx') THEN
    CREATE INDEX "jogos_dataHora_idx" ON "public"."jogos"("dataHora");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogos' AND indexname = 'idx_jogos_edicao') THEN
    CREATE INDEX "idx_jogos_edicao" ON "public"."jogos"("edicaoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogo_times' AND indexname = 'idx_jogo_times_jogo') THEN
    CREATE INDEX "idx_jogo_times_jogo" ON "public"."jogo_times"("jogoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'jogo_times' AND indexname = 'idx_jogo_times_time') THEN
    CREATE INDEX "idx_jogo_times_time" ON "public"."jogo_times"("timeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'evento_jogo' AND indexname = 'evento_jogo_jogoId_idx') THEN
    CREATE INDEX "evento_jogo_jogoId_idx" ON "public"."evento_jogo"("jogoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'evento_jogo' AND indexname = 'evento_jogo_timeId_idx') THEN
    CREATE INDEX "evento_jogo_timeId_idx" ON "public"."evento_jogo"("timeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'evento_jogo' AND indexname = 'evento_jogo_jogadorId_idx') THEN
    CREATE INDEX "evento_jogo_jogadorId_idx" ON "public"."evento_jogo"("jogadorId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'evento_jogo' AND indexname = 'evento_jogo_jogadorSubstituidoId_idx') THEN
    CREATE INDEX "evento_jogo_jogadorSubstituidoId_idx" ON "public"."evento_jogo"("jogadorSubstituidoId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'evento_jogo' AND indexname = 'evento_jogo_tipo_idx') THEN
    CREATE INDEX "evento_jogo_tipo_idx" ON "public"."evento_jogo"("tipo");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'evento_jogo' AND indexname = 'evento_jogo_minuto_idx') THEN
    CREATE INDEX "evento_jogo_minuto_idx" ON "public"."evento_jogo"("minuto");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'estatistica_time' AND indexname = 'idx_estatistica_time_modalidade') THEN
    CREATE INDEX "idx_estatistica_time_modalidade" ON "public"."estatistica_time"("modalidadeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'estatistica_jogador' AND indexname = 'idx_estatistica_jogador_modalidade') THEN
    CREATE INDEX "idx_estatistica_jogador_modalidade" ON "public"."estatistica_jogador"("modalidadeId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'turma_times' AND indexname = 'idx_turma_time_turma') THEN
    CREATE INDEX "idx_turma_time_turma" ON "public"."turma_times"("turmaId");
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'turma_times' AND indexname = 'idx_turma_time_time') THEN
    CREATE INDEX "idx_turma_time_time" ON "public"."turma_times"("timeId");
  END IF;
END $$;