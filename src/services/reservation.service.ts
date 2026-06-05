import { prisma } from "../lib/prisma";

export async function checkReservation(eventId: string, seatNumbers: string[]) {
    const event = await prisma.event.findUnique({
        where: {
            id: eventId
        }
    });
    if (!event) {
        throw new Error("Event not found");
    }
    //raw SQL Eg of follwing primsa code:
    // SELECT * FROM seat
    // WHERE eventId = '123'
    // AND seatNumber IN ('A1, 'B1', 'C1');
    const seats = await prisma.seat.findMany({
        where: {
            eventId,
            seatNumber: {
                in: seatNumbers
            }
        }
    })
    if (seats.length === 0) {
        throw new Error("Seats not available");
    } else if (seats.length != seatNumbers.length) {
        throw new Error("One or More seats do not exits")
    }
    return seats;
}
