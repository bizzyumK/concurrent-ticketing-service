import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import eventRoutes from './routes/events';
import reservationRoutes from './routes/reservation';
import authRoute from './routes/auth';
import { errorMiddleware } from './middleware/error.middleware';
import { redis } from './lib/redis';
import { apiLimiter } from './middleware/rate-limiter';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger';

const app = express();

app.use(express.json());
//pinoHttp is an middlware which automatically logs every HTTP request
app.use(
    pinoHttp({
        logger,
        serializers: {
            req(req) {
                return { method: req.method, url: req.url };
            },
            res(res) {
                return { statusCode: res.statusCode };
            }
        },
        customLogLevel: (req, res, err) => {
            if (res.statusCode >= 500 || err) {
                return "error";
            }
            if (res.statusCode >= 400) {
                return "warn";
            }
            return "info";
        }
    })
);
app.use(apiLimiter);//global limter
app.use('/api/events', eventRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth', authRoute);
//Global Middlware -> must be last
app.use(errorMiddleware);
app.get('/redis-status', (_: Request, res: Response) => {
    return res.json({ redistStatus: redis.status });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server is running at Port: ${PORT} `);
});
