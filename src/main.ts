import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log("Server is running at: ", PORT)
});