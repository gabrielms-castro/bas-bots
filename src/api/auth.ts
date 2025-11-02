import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { BadRequestError, NotFoundError, UserNotAuthenticatedError } from "./errors";
import { getUserByEmail } from "../db/users";
import { checkPasswordHash } from "../auth";
import { respondWithJSON } from "./json";

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
    return respondWithJSON(200,{
        user,
    })
}