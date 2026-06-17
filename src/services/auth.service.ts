import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { createError } from "../lib/error";
import { generateToken } from "../lib/jwt";

export async function register(username: string, email: string, password: string) {
    if (!email || !password || !username) {
        throw createError("Email and password required", 400);
    }

    const existing = await prisma.user.findUnique({
        where: { email }
    });

    if (existing) {
        throw createError("User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword
        }
    });

    const token = generateToken(user.id);

    return { user, token };
}

export async function login(email: string, password: string) {
    if (!email || !password) {
        throw createError("Email and password required", 400);
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw createError("Invalid credentials", 401);
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        throw createError("Invalid credentials", 401);
    }

    const token = generateToken(user.id);

    return { user, token };
}