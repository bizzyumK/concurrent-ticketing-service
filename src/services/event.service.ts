import { prisma } from "../lib/prisma";

export function createEvent(title: string) {
    return prisma.event.create({
        data: { title }
    });
}

export function getEvents() {
    return prisma.event.findMany();
}

export function getEventById(eventId: string) {
    return prisma.event.findUnique({
        where: {
            id: eventId
        }
    });
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

export function getSeats(eventId: string) {
    return prisma.seat.findMany({
        where: {
            eventId: eventId,
        },
        include: {
            event: true
        }
    });
}

//the seats that are not held, confirm
export async function availableSeats(eventId: string) {
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
    return availableSeats;
}