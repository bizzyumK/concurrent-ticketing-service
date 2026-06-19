import express, { NextFunction, Request, Response } from 'express';
// import { activeReservations, checkSeatAvailability, createReservation, reserveSeats } from '../services/reservation.service';
import { cancelReservation, confirmReservation, reserveSeats } from '../services/reservation.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
// Note: Reservation is not a purchase
// it mean holding the seats temporarily until the final transaction is done
// Concurrency Occurence:
// * user A and user B reserve the same ticket
// * now who will held the ticket? 

// router.post('/', async (req: Request, res: Response) => {
//     const { eventId, seatNumbers } = req.body;
//     if (!eventId || !seatNumbers) {
//         return res.status(400).json({ message: "EventId and SeatNumbers are required" });
//     }
//     try {
//         const seats = await checkSeatAvailability(eventId, seatNumbers);
//         //converting the seatNumbers into it's respective ids for better db communication
//         const seatIds: string[] = [];
//         seats.map((seat) => {
//             seatIds.push(seat.id);
//         })

//         //This line was added to check the concurrency bug
//         // await new Promise(res => setTimeout(res, 3000));

//         const activeSeat = await activeReservations(seatIds);
//         //checks if the seats are active/reserved or not
//         if (activeSeat.length > 0) {
//             return res.status(409).json({
//                 message: "One or more seats are already reserved"
//             });
//         }

//         const reservation = await createReservation(seatIds);

//         return res.status(200).json({
//             message: "Reservation Successful",
//             reservation
//         });
//     } catch (err: any) {
//         return res.status(500).json({
//             message: `${err.message}`
//         });
//     }
// });

router.post("/", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, seatNumbers } = req.body;
    try {
        const reservation = await reserveSeats(eventId, seatNumbers, req.user.id);
        return res.status(200).json(reservation);
    } catch (err: any) {
        next(err);
    }
});

router.post('/:reservationId/confirm', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const reservationId = req.params.reservationId as string;
    try {
        const response = await confirmReservation(reservationId, req.user?.id);
        return res.status(200).json({
            message: "Payment Confirmed",
            response
        });
    } catch (err: any) {
        next(err);
    }

});

router.post('/:reservationId/cancel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const reservationId = req.params.reservationId as string;
    try {
        const response = await cancelReservation(reservationId, req.user?.id);
        return res.status(200).json({
            message: "Payment Cancelled successfully",
            response
        });
    } catch (err: any) {
        next(err);
    }
})

export default router;