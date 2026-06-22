import pino from "pino";

// logger.info/error/warn -> Logs important business events that YOU choose
// pino-http -> Logs every HTTP request automatically
export const logger = pino({
    level: 'info',
    transport: {
        target: "pino-pretty", //it makes logs readable
        options: {
            colorize: true
        }
    }
});