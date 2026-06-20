import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import eventRoutes from './routes/events';
import reservationRoutes from './routes/reservation';
import authRoute from './routes/auth';
import { errorMiddleware } from './middleware/error.middleware';
import { redis } from './lib/redis';

const app = express();

app.use(express.json());
app.use('/api/events', eventRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth', authRoute);
//Global Middlware -> must be last
app.use(errorMiddleware);
app.get('/redis-status', (_: Request, res: Response) => {
    return res.json({ redistStatus: redis.status });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log("Server is running at: ", PORT)
});
