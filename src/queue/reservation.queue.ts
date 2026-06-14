import { Queue } from "bullmq";

//establishing the connection with redis and creating a queue(reservation-expiry)
export const reservationQueue = new Queue("reservation-expiry", {
    connection: {
        host: "127.0.0.1",
        port: 6379, //default port of redis
        maxRetriesPerRequest: null
    }
});