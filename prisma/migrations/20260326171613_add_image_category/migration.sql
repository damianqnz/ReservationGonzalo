-- CreateEnum
CREATE TYPE "ImageCategory" AS ENUM ('SALA', 'COZINHA', 'QUARTO', 'CASA_DE_BANHO', 'EXTERIOR', 'ENTRADA', 'LAVANDARIA', 'PISCINA', 'JARDIM', 'VARANDA', 'ESCRITORIO', 'OUTRO');

-- AlterTable
ALTER TABLE "property_images" ADD COLUMN     "category" "ImageCategory" DEFAULT 'OUTRO';

-- AlterTable
ALTER TABLE "room_images" ADD COLUMN     "category" "ImageCategory" DEFAULT 'OUTRO';
