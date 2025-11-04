import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { BadRequestError, UserNotAuthenticatedError } from "./errors";
import { getUserByEmail, getUserByRefreshToken, type UserResponse } from "../db/users";
import { checkPasswordHash, getBearerToken, makeJWT, makeRefreshToken } from "../auth";
import { respondWithJSON } from "./json";
import { createRefreshToken, revokeRefreshToken } from "../db/refresh-tokens";

export async function handlerLogin(config: ApiConfig, req: BunRequest) {
    const { email, password } = await req.json();
    if (!email || !password) {
        throw new BadRequestError("É necessário fornecer um e-mail e uma senha")
    }

    const user = await getUserByEmail(config.db, email)
    if (!user) {
        throw new UserNotAuthenticatedError("E-mail ou senha incorretos. Tente novamente")
    }

    const valid = await checkPasswordHash(password, user.password)
    if (!valid) {
        throw new UserNotAuthenticatedError("E-mail ou senha incorretos. Tente novamente")
    }

    const accessExpiresMs = 30 * 24 * 60 * 60 * 1000;
    const accessToken = makeJWT(user.id, config.jwtSecret, accessExpiresMs)

    const refreshExpiresMs = 60 * 24 * 60 * 60 * 1000;
    const refreshToken = makeRefreshToken();
    await createRefreshToken(config.db, {
        token: refreshToken,
        userID: user.id,
        expiresAt: new Date(Date.now() + refreshExpiresMs)
    })

    const userResponse = {
        id: user.id,
        email: user.email,
        created_at: user.createdAt,
        updated_at: user.updatedAt
    } satisfies UserResponse
    return respondWithJSON(200,{
        user: userResponse,
        token: accessToken,
        refreshToken: refreshToken
    });
}

export async function handlerRefreshToken(config: ApiConfig, req: BunRequest) {
    const refreshToken = getBearerToken(req.headers) as string;
    const user = await getUserByRefreshToken(config.db, refreshToken)
    if (!user) {
        throw new UserNotAuthenticatedError("Invalid or expired refresh token")
    }
    const oneHourMs = 60*60*1000;
    const accessToken = makeJWT(user.id, config.jwtSecret, oneHourMs);

    const userResponse = {
        id: user.id,
        email: user.email,
        created_at: user.createdAt,
        updated_at: user.updatedAt
    } satisfies UserResponse

    return respondWithJSON(200, {
        user: userResponse,
        token: accessToken
    })
}

export async function handlerRevoke(config: ApiConfig, req: BunRequest) {
    const refreshToken = getBearerToken(req.headers) as string;
    await revokeRefreshToken(config.db, refreshToken)
    return respondWithJSON(204, {})
}