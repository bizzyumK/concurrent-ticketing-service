import { prisma } from "../lib/prisma";
import { redis } from '../lib/redis';

export function createEvent(title: string) {
    return prisma.event.create({
        data: { title }
    });
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
        throw new Error("Event not found");
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
    return prisma.seat.createMany({
        data: seats
    });
};

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