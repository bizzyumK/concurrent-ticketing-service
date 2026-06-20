import Redis from 'ioredis';

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxLoadingRetryTime: 3, //is redis died temporarily then it will only try three times instead of trying forever
    enableReadyCheck: true, //before sending command, it checks the ready status
    keepAlive: 5000
});

redis.on("connect", () => {
    console.log("Redis Connected");
});

redis.on('error', () => {
    console.log("not working");
})