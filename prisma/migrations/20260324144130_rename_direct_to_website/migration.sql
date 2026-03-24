/*
  Warnings:

  - The values [DIRECT] on the enum `BookingSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BookingSource_new" AS ENUM ('WEBSITE', 'AIRBNB', 'BOOKING', 'MANUAL');
ALTER TABLE "public"."bookings" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "source" TYPE "BookingSource_new" USING ("source"::text::"BookingSource_new");
ALTER TYPE "BookingSource" RENAME TO "BookingSource_old";
ALTER TYPE "BookingSource_new" RENAME TO "BookingSource";
DROP TYPE "public"."BookingSource_old";
ALTER TABLE "bookings" ALTER COLUMN "source" SET DEFAULT 'WEBSITE';
COMMIT;

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "source" SET DEFAULT 'WEBSITE';
