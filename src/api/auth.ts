import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { BadRequestError, NotFoundError, UserNotAuthenticatedError } from "./errors";
import { getUserByEmail } from "../db/users";
import { checkPasswordHash, makeJWT, makeRefreshToken } from "../auth";
import { respondWithJSON } from "./json";
import { createRefreshToken } from "../db/refresh-tokens";

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

    return respondWithJSON(200,{
        user,
        token: accessToken,
        refreshToken: refreshToken
    })
}