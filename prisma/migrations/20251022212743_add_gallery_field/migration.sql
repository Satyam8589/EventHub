-- AlterTable
ALTER TABLE "events" ADD COLUMN     "gallery" JSONB[] DEFAULT ARRAY[]::JSONB[];
