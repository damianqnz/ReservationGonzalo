-- CreateTable
CREATE TABLE "search_events" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "roomId" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "guests" INTEGER,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "convertedToBooking" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_events_sessionId_idx" ON "search_events"("sessionId");

-- CreateIndex
CREATE INDEX "search_events_propertyId_idx" ON "search_events"("propertyId");

-- CreateIndex
CREATE INDEX "search_events_createdAt_idx" ON "search_events"("createdAt");

-- AddForeignKey
ALTER TABLE "search_events" ADD CONSTRAINT "search_events_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_events" ADD CONSTRAINT "search_events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_events" ADD CONSTRAINT "search_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
