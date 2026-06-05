import express, { Request, Response } from 'express';
import { checkReservation } from '../services/reservation.service';

const router = express.Router();
// Note: Reservation is not a purchase
// it mean holding the seats temporarily until the final transaction is done
// Concurrency Occurence:
// * user A and user B reserve the same ticket
// * now who will held the ticket? 

router.post('/', async (req: Request, res: Response) => {
    const { eventId, seatNumbers } = req.body;
    if (!eventId || !seatNumbers) {
        return res.status(400).json({ message: "EventId and SeatNumbers are required" });
    }
    try {
        const seats = await checkReservation(eventId, seatNumbers);
        return res.status(200).json({
            message: "Seats are available",
            seats
        });
    } catch (err: any) {
        return res.status(500).json({
            message: `Internal server error, ${err.message}`
        });
    }
});

export default router;