/*
  Warnings:

  - Added the required column `price` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `section` to the `Seat` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Seat_eventId_key";

-- AlterTable
ALTER TABLE "Seat" ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "section" TEXT NOT NULL;
