/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `event_admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingId]` on the table `ticket_verifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assignedBy` to the `event_admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isValid` to the `ticket_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_admins" ADD COLUMN     "assignedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ticket_verifications" ADD COLUMN     "isValid" BOOLEAN NOT NULL,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_admins_userId_key" ON "event_admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_verifications_bookingId_key" ON "ticket_verifications"("bookingId");
