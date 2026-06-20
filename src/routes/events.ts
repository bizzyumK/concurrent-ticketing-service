import express, { Request, Response } from 'express';
import { availableSeats, createEvent, createSeats, getEventById, getEvents, getSeats } from '../services/event.service';
import checkAdmin, { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authMiddleware, checkAdmin, async (req: Request, res: Response) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ message: "Event title is required" });
    }
    try {
        const event = await createEvent(title);
        return res.status(201).json(event);
    } catch (err: any) {
        console.error("Error while creating event:", err.message);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.get('/', async (_: Request, res: Response) => {
    try {
        const events = await getEvents();
        if (events.length == 0) return res.status(200).json({
            message: "No Events at a moment",
            data: events
        });

        return res.status(200).json({
            message: "Events fetch Success",
            totalEvent: events.length,
            data: events
        });
    } catch (err: any) {
        console.error("Cannot fetch the events:", err.message);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.get('/:eventId', async (req: Request, res: Response) => {
    const eventId = req.params.eventId as string;
    try {
        const event = await getEventById(eventId);
        return res.status(200).json({
            message: "Event fetched successfully",
            data: event
        });
    } catch (err: any) {
        console.error("Cannot fetch the events:", err.message);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.post('/:eventId/seats', authMiddleware, checkAdmin, async (req: Request, res: Response) => {
    const eventId = req.params.eventId as string;
    const { seatNumbers, price, section } = req.body;
    if (!seatNumbers.length || !price || !section) {
        return res.status(400).json({
            message: "Section, price ,seatNumber are required"
        });
    }
    try {
        const result = await createSeats(eventId, seatNumbers, price, section);
        return res.status(200).json({
            message: "Seats created",
            data: result
        });
    } catch (err: any) {
        console.error("Cannot fetch the events:", err.message);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.get('/:eventId/seats', async (req: Request, res: Response) => {
    const eventId = req.params.eventId as string;
    try {
        const seats = await getSeats(eventId);
        return res.status(200).json({
            message: "seats fetched successfully",
            seats
        });
    } catch (err: any) {
        console.error("Cannot fetch the events:", err.message);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.get('/available/:eventId/seats', async (req: Request, res: Response) => {
    const eventId = req.params.eventId as string;
    try {
        const seats = await availableSeats(eventId);
        return res.status(200).json({
            message: "seats fetched successfully",
            seats
        });
    } catch (err: any) {
        console.error("Cannot fetch the events:", err.message);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

export default router;

