-- CreateTable
CREATE TABLE "guest_access_logs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "confirmationCode" TEXT,
    "bookingId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "guest_access_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "guest_access_logs" ADD CONSTRAINT "guest_access_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
