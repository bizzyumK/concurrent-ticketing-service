import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = header.split(" ")[1];
        const decoded = verifyToken(token);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

export default function checkAdmin(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    if (user.role === "ADMIN") {
        next();
    } else {
        return res.status(403).json({ message: "Sorry buddy you are not ADMIN" });
    }
}