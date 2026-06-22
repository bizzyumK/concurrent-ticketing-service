import { Worker } from "bullmq";
import dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

//wokers are consumer
//so what happen is:
// it will keep on waiting until redis give a job to process
const worker = new Worker(
    "reservation-expiry",
    async (job) => {
        logger.info({
            jobId: job.id
        }, "Processing Job"
        );

        const { reservationId } = job.data;

        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId }
        });

        if (!reservation) {
            logger.info("Reservation not found");
            return;
        }

        if (reservation.status === "HELD") {
            await prisma.reservation.update({
                where: { id: reservationId },
                data: { status: "EXPIRED" }
            });

            logger.warn({
                reservationId
            }, "Reservation Expired");
        }
    },
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            maxRetriesPerRequest: null
        }
    }
);

worker.on("completed", job => {
    logger.info({
        jobId: job.id
    }, "Job Completed");
});

worker.on("failed", (job, err) => {
    logger.error({
        jobId: job?.id,
        err
    }, "Job Failed");
});

logger.info("Worker is running...");