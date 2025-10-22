/*
  Warnings:

  - You are about to drop the column `createdAt` on the `event_admins` table. All the data in the column will be lost.
  - Added the required column `eventId` to the `ticket_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."event_admins" DROP CONSTRAINT "event_admins_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."event_admins" DROP CONSTRAINT "event_admins_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ticket_verifications" DROP CONSTRAINT "ticket_verifications_bookingId_fkey";

-- AlterTable
ALTER TABLE "event_admins" DROP COLUMN "createdAt",
ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ticket_verifications" ADD COLUMN     "eventId" TEXT NOT NULL,
ALTER COLUMN "isValid" SET DEFAULT true;

-- AddForeignKey
ALTER TABLE "event_admins" ADD CONSTRAINT "event_admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_admins" ADD CONSTRAINT "event_admins_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_admins" ADD CONSTRAINT "event_admins_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_verifications" ADD CONSTRAINT "ticket_verifications_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_verifications" ADD CONSTRAINT "ticket_verifications_scannedBy_fkey" FOREIGN KEY ("scannedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_verifications" ADD CONSTRAINT "ticket_verifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
