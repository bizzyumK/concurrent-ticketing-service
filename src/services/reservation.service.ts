import { prisma } from "../lib/prisma";

export async function checkSeatAvailability(eventId: string, seatNumbers: string[]) {
    //checking if the event exist or not
    const event = await prisma.event.findUnique({
        where: {
            id: eventId
        }
    });
    if (!event) {
        throw new Error("Event not found");
    }
    //checking the seat availability
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

//check if the reservation is held or not
// raw sql:
// SELECT rs.*
// FROM "ReservationSeat" AS rs
// JOIN "Reservation" AS r
// ON rs."reservationId" = r."id"
// WHERE rs."seatId" IN ('S1', 'S2', 'S3')
// AND r."status" IN ('HELD', 'CONFIRMED');

//what this mean is : do any of seats(seatsId) belong to an active rerservation?
export async function activeReservations(seatIds: string[]) {
    const status = await prisma.reservationSeat.findMany({
        where: {
            seatId: {
                in: seatIds
            },
            reservation: {
                status: {
                    in: ['HELD', 'CONFIRMED']
                }
            }
        }
    });
    return status;
}

export async function createReservation(seatIds: string[]) {
    const reservation = await prisma.reservation.create({
        data: {
            status: "HELD",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
    });
    await prisma.reservationSeat.createMany({
        data: seatIds.map(seatId => ({
            reservationId: reservation.id,
            seatId
        }))
    });
    return reservation;
}