import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorMiddleware(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    logger.error({
        err,
        method: req.method,
        path: req.path
    },
        "Request failed"
    );
    return res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error"
    });
}