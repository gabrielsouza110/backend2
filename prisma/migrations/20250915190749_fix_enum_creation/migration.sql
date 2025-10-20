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