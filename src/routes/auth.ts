import express from "express";
import { register, login } from "../services/auth.service";
import { loginLimiter, registrationLimiter } from "../middleware/rate-limiter";

const router = express.Router();

router.post("/register", registrationLimiter, async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const result = await register(username, email, password);
        return res.status(200).json(result);
    } catch (err: any) {
        next(err);
    }
});

router.post("/login", loginLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        return res.status(200).json(result);
    } catch (err: any) {
        next(err);
    }
});

export default router;