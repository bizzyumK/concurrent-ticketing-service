import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { reservationQueue } from "../queue/reservation.queue";
import { createError } from "../lib/error";

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
export async function reserveSeats(eventId: string, seatNumbers: string[], userId: string) {
    const reservation = await prisma.$transaction(async (tx: any) => {
        // Step 1: Check whether the event exists.
        // No point reserving seats for an event that doesn't exist.
        const event = await tx.event.findUnique({
            where: {
                id: eventId
            }
        });
        if (!event) {
            throw createError("Event not found", 404);
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
            throw createError("Seats not available", 404);
        } else if (seats.length != seatNumbers.length) {
            throw createError("One or more seats do not exist", 400);
        }

        // Convert Seat objects into seat IDs.
        // ReservationSeat table stores seatId instead of seatNumber.
        const seatIds = seats.map((seat: any) => seat.id);

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
            throw createError("Already reserved", 409);
        }

        // Step 4: Create a new reservation with HELD status.
        // The reservation expires after 5 minutes if unpaid.
        const reservation = await tx.reservation.create({
            data: {
                status: "HELD",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                userId
            }
        });
        // Step 5: Link every selected seat to this reservation
        // through the ReservationSeat join table.
        await tx.reservationSeat.createMany({
            data: seatIds.map((id: any) => ({
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
    //adding BULLMQ expiration
    //what bullmq does is:
    // 1. stores job 
    // 2. schedule job(delay, retires)
    // 3. deliver job to worker safely
    // NOTE: uses redis to store job data, deplaly job, retries etc

    //this is a producer
    //this tells redis to wake me up after delay time -> job is added to redis
    //it will wakeup(active) the worker for further process after delay time along with job data
    const job = await reservationQueue.add(
        "expire-reservation", //job name
        {
            reservationId: reservation.id//jobs data
        },
        {
            delay: 5 * 60 * 1000//5min delay
        }
    );
    console.log("Job added:", job.id);
    return reservation;
}

export async function confirmReservation(reservationId: string) {
    if (!reservationId) {
        throw createError("ReservationId not provided", 400);
    }
    const reservation = await prisma.reservation.findUnique({
        where: {
            id: reservationId
        }
    });
    if (!reservation) {
        throw createError("Reservation not found", 404);
    }
    if (reservation.status == "HELD") {
        return prisma.reservation.update({
            where: {
                id: reservationId
            },
            data: {
                status: 'CONFIRMED'
            }
        });
    }
    if (reservation.status === "CONFIRMED")
        throw createError("Reservation already confirmed", 409);

    if (reservation.status === "EXPIRED")
        throw createError("Reservation expired", 410);

    if (reservation.status === "CANCELLED")
        throw createError("Reservation already cancelled", 409);
}

export async function cancelReservation(reservationId: string) {
    if (!reservationId) {
        throw createError("ReservationId not provided", 400);
    }
    const reservation = await prisma.reservation.findUnique({
        where: {
            id: reservationId
        }
    });
    if (!reservation) {
        throw createError("Reservation not found", 400);
    }
    if (reservation.status == "HELD") {
        return prisma.reservation.update({
            where: {
                id: reservationId
            },
            data: {
                status: 'CANCELLED'
            }
        });
    }
    if (reservation.status === "CONFIRMED") {
        throw createError("Reservation already confirmed", 409);
    }

    if (reservation.status === "EXPIRED") {
        throw createError("Reservation expired", 409);
    }

    if (reservation.status === "CANCELLED") {
        throw createError("Reservation already cancelled", 409);
    }

}