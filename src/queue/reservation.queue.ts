import { Queue } from "bullmq";

//establishing the connection with redis and creating a queue(reservation-expiry)
export const reservationQueue = new Queue("reservation-expiry", {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT), //default port of redis
        maxRetriesPerRequest: null
    }
});