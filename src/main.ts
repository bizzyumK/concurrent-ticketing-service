import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import eventRoutes from './routes/events';
import reservationRoutes from './routes/reservation';

const app = express();

app.use(express.json());
app.use('/api/events', eventRoutes);
app.use('/api/reservations', reservationRoutes);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log("Server is running at: ", PORT)
});