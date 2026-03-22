-- CreateTable
CREATE TABLE "ical_syncs" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "source" TEXT NOT NULL,
    "icalUrl" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "syncedDates" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ical_syncs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ical_syncs" ADD CONSTRAINT "ical_syncs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ical_syncs" ADD CONSTRAINT "ical_syncs_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
