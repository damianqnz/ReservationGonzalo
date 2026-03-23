-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "bathroomType" TEXT DEFAULT 'private',
ADD COLUMN     "bedsList" TEXT,
ADD COLUMN     "services" TEXT;
