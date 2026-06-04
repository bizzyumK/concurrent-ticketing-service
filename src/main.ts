import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import eventRoutes from './routes/events';

const app = express();

app.use(express.json());
app.use('/api', eventRoutes);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log("Server is running at: ", PORT)
});