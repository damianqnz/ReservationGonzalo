-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GUEST';

-- This step must run in a separate transaction
COMMIT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "acceptedMarketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acceptedPrivacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "guestCountry" TEXT,
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'GUEST';
