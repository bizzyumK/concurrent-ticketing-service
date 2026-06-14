import { Worker } from "bullmq";
import dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";

//wokers are consumer
//so what happen is:
// it will keep on waiting until redis give a job to process
const worker = new Worker(
    "reservation-expiry",
    async (job) => {
        console.log("Processing job:", job.id);

        const { reservationId } = job.data;

        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId }
        });

        if (!reservation) {
            console.log("Reservation not found");
            return;
        }

        if (reservation.status === "HELD") {
            await prisma.reservation.update({
                where: { id: reservationId },
                data: { status: "EXPIRED" }
            });

            console.log("Expired", reservationId);
        }
    },
    {
        connection: {
            host: "127.0.0.1",
            port: 6379,
            maxRetriesPerRequest: null
        }
    }
);

worker.on("completed", job => {
    console.log("Completed:", job.id);
});

worker.on("failed", (job, err) => {
    console.log("Failed:", job?.id, err);
});

console.log("Worker is running...");