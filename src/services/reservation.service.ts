import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

// export async function checkSeatAvailability(eventId: string, seatNumbers: string[]) {
//     //checking if the event exist or not
//     const event = await prisma.event.findUnique({
//         where: {
//             id: eventId
//         }
//     });
//     if (!event) {
//         throw new Error("Event not found");
//     }
//     //checking the seat availability
//     //raw SQL Eg of follwing primsa code:
//     // SELECT * FROM seat
//     // WHERE eventId = '123'
//     // AND seatNumber IN ('A1, 'B1', 'C1');
//     const seats = await prisma.seat.findMany({
//         where: {
//             eventId,
//             seatNumber: {
//                 in: seatNumbers
//             }
//         }
//     })
//     if (seats.length === 0) {
//         throw new Error("Seats not available");
//     } else if (seats.length != seatNumbers.length) {
//         throw new Error("One or More seats do not exits")
//     }
//     return seats;
// }

// //check if the reservation is held or not
// // raw sql:
// // SELECT rs.*
// // FROM "ReservationSeat" AS rs
// // JOIN "Reservation" AS r
// // ON rs."reservationId" = r."id"
// // WHERE rs."seatId" IN ('S1', 'S2', 'S3')
// // AND r."status" IN ('HELD', 'CONFIRMED');

// //what this mean is : do any of seats(seatsId) belong to an active rerservation?
// export async function activeReservations(seatIds: string[]) {
//     const status = await prisma.reservationSeat.findMany({
//         where: {
//             seatId: {
//                 in: seatIds
//             },
//             reservation: {
//                 status: {
//                     in: ['HELD', 'CONFIRMED']
//                 }
//             }
//         }
//     });
//     return status;
// }

// export async function createReservation(seatIds: string[]) {
//     const reservation = await prisma.reservation.create({
//         data: {
//             status: "HELD",
//             expiresAt: new Date(Date.now() + 5 * 60 * 1000)
//         }
//     });
//     await prisma.reservationSeat.createMany({
//         data: seatIds.map(seatId => ({
//             reservationId: reservation.id,
//             seatId
//         }))
//     });
//     return reservation;
// }

interface LockedSeat {
    id: string,
    seatNumber: string,
    eventId: string,
    price: number,
    section: string,
    createdAt: Date
}
// TRANSATION ARE GROUP OF DB OPERATION THAT ARE TREATED AS A SINGLE UNIT OR WORK.
// Eg:
// BEGIN
// operation 1
// operation 2
// operation 3
// END if succeed then COMMIT else ROLLBACK

// Everything runs inside ONE database transaction.
// If any step fails, Prisma automatically ROLLBACKS all previous changes.

//why did i use transaction here?
//--> because reservtion contain multiple query operation so if one fails everything else should fail
export async function reserveSeats(eventId: string, seatNumbers: string[]) {
    return await prisma.$transaction(async (tx) => {
        // Step 1: Check whether the event exists.
        // No point reserving seats for an event that doesn't exist.
        const event = await tx.event.findUnique({
            where: {
                id: eventId
            }
        });
        if (!event) {
            throw new Error("Event not found");
        }

        // Step 2: Fetch all requested seats that belong to this event.
        // Example:
        // eventId = E1
        // seatNumbers = ["A1", "A2"]
        // const seats = await tx.seat.findMany({
        //     where: {
        //         eventId,
        //         seatNumber: {
        //             in: seatNumbers
        //         }
        //     }
        // });

        //locking the seat row
        //locking flow is shown in reservation.md
        const seats = await tx.$queryRaw<LockedSeat[]> `
        SELECT * 
        FROM "Seat"
        WHERE "eventId" = ${eventId}
        AND "seatNumber" IN (${Prisma.join(seatNumbers)})
        FOR UPDATE
        `;

        if (seats.length === 0) {
            throw new Error("Seats not available");
        } else if (seats.length != seatNumbers.length) {
            throw new Error("One or More seats do not exist");
        }

        // Convert Seat objects into seat IDs.
        // ReservationSeat table stores seatId instead of seatNumber.
        const seatIds = seats.map(seat => seat.id);

        // Step 3: Check whether any requested seat already belongs
        // to an active reservation (HELD or CONFIRMED).
        const active = await tx.reservationSeat.findMany({
            where: {
                seatId: {
                    in: seatIds
                },
                reservation: {
                    status: {
                        in: ["HELD", "CONFIRMED"]
                    }
                }
            }
        });

        // If at least one seat is already reserved,
        // reject the request.
        if (active.length > 0) {
            throw new Error("Already reserved");
        }

        // Step 4: Create a new reservation with HELD status.
        // The reservation expires after 5 minutes if unpaid.
        const reservation = await tx.reservation.create({
            data: {
                status: "HELD",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        });

        // Step 5: Link every selected seat to this reservation
        // through the ReservationSeat join table.
        await tx.reservationSeat.createMany({
            data: seatIds.map(id => ({
                reservationId: reservation.id,
                seatId: id
            }))
        });

        // If execution reaches here, every query succeeded.
        // Prisma will COMMIT the transaction automatically.

        // A transaction guarantees that all database operations
        // succeed together or fail together (atomicity).
        // To prevent two users from reserving the same seat at
        // the same time, we additionally lock the seat rows
        // using SELECT ... FOR UPDATE.
        return reservation;
    });
}