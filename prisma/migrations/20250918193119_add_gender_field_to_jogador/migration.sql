-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GeneroJogador') THEN
        CREATE TYPE "public"."GeneroJogador" AS ENUM ('Masculino', 'Feminino', 'Misto');
    END IF;
END
$$;

-- AlterTable
ALTER TABLE "public"."jogadores" ADD COLUMN     "genero" "public"."GeneroJogador";
