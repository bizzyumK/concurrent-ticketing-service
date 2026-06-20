import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, //1min interval
    max: 5,//max req one can send within 1min
    message: { //res.status 429. sends automatically by express-rate-limiter
        message: "Too many login attempts"
    }
});

export const registrationLimiter = rateLimit({
    windowMs: 1 * 60 * 60 * 1000, //60min
    max: 10,
    message: {
        message: "Too may registration attempt"
    }
});

export const reservationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        message: "Too many reservation attempts"
    }
});

// Added to prevent unnecessary load on the database and Redis during confirmation.
export const confirmLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        message: "Too many confirmation attempts"
    }
});
//This is for global limiter
//suppose someone used for loop to send 10000 req at a time
//so to prevent that we can use this apiLimiter
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100
});