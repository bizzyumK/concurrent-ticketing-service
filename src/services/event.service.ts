import { Prisma } from "@prisma/client";
import { createError } from "../lib/error";
import { prisma } from "../lib/prisma";
import { redis } from '../lib/redis';

export async function createEvent(title: string) {
    const newEvent = prisma.event.create({
        data: { title }
    });
    //if not in cached then (del) will simply return 0 and nothing will happen so error handling is strictly not required
    await redis.del('events');//this is called redis invalidation
    return newEvent;
}

export async function getEvents() {
    const cached = await redis.get("events");
    if (cached) {
        console.log("Cached Hit");
        return JSON.parse(cached);
    }
    //if missed then set data to redis
    console.log("Cached missed");
    const events = await prisma.event.findMany();
    await redis.set("events", JSON.stringify(events), "EX", 60);//here EX 60 is a ttl timu
    return events;
}

export async function getEventById(eventId: string) {
    const cached = await redis.get("singleEvent");
    if (cached) {
        console.log("Cached Hit");
        return JSON.parse(cached);
    }
    console.log("Cached missed");
    const event = await prisma.event.findUnique({
        where: {
            id: eventId
        }
    });
    await redis.set('singleEvent', JSON.stringify(event), "EX", 60);
    return event;
}

export async function createSeats(eventId: string, seatNumber: string[], price: number, section: string) {
    const event = await prisma.event.findUnique({
        where: {
            id: eventId
        }
    });
    if (!event) {
        throw createError("Event not found", 404);
    }
    //Set the bulk of data at once
    //because user will send it in an array form
    //eg: [A1, A2, A3, A4] with each seatNumber having same eventId, section, price 
    const seats = seatNumber.map((seat) => {
        return {
            eventId,
            seatNumber: seat,
            section,
            price
        }
    })
    //create the data in database
    try {
        const newSeats = await prisma.seat.createMany({
            data: seats
        });
        await redis.del("seats");
        return newSeats;
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            throw createError(
                "One or more seat numbers already exist for this event",
                409
            );
        }
        throw err;
    };
}

export async function getSeats(eventId: string) {
    const cached = await redis.get("seats");
    if (cached) {
        console.log("Cached Hit");
        return JSON.parse(cached); //convert string into json
    }
    console.log("Cached missed");
    const seats = await prisma.seat.findMany({
        where: {
            eventId: eventId,
        },
        include: {
            event: true
        }
    });
    await redis.set('seats', JSON.stringify(seats), "EX", 60);
    return seats;
}

//the seats that are not held, confirm
export async function availableSeats(eventId: string) {
    const cached = await redis.get("availableSeats");
    if (cached) {
        console.log("Cached Hit");
        return JSON.parse(cached);
    }
    console.log("Cached missed");
    const seats = await prisma.seat.findMany({
        where: {
            eventId
        },
        include: {
            reservationSeats: {
                include: {
                    reservation: true
                }
            }
        }
    });
    const availableSeats = seats.map((seat) => {
        const active = seat.reservationSeats.some((rs) => {
            return rs.reservation.status == "HELD" || rs.reservation.status == "CONFIRMED"
        });
        return {
            seatNumber: seat.seatNumber,
            section: seat.section,
            price: seat.price,
            available: !active
        };
    });
    await redis.set('availableSeats', JSON.stringify(availableSeats), 'EX', 60);
    return availableSeats;
}