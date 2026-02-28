/*
  Warnings:

  - You are about to drop the column `embeddingJson` on the `KnowledgeChunk` table. All the data in the column will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "KnowledgeChunk" DROP COLUMN "embeddingJson",
ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "systemPrompt" TEXT;
