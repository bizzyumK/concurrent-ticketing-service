/*
  Warnings:

  - A unique constraint covering the columns `[eventId,seatNumber]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Seat_eventId_seatNumber_key" ON "Seat"("eventId", "seatNumber");
