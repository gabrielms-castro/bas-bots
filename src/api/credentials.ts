import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { respondWithJSON } from "./json";
import { BadRequestError, UserNotAuthenticatedError } from "./errors";
import { createCredential, getCredentialByName, updateCredential } from "../db/credentials";
import { getBearerToken, validateJWT } from "../auth";

export async function handlerCreateCredential(config: ApiConfig, req: BunRequest) {
    const token = getBearerToken(req.headers) as string;
    const userID = validateJWT(token, config.jwtSecret);
    if (!userID) {
        throw new UserNotAuthenticatedError("Invalid token")
    }

    const { credentialName, login, password } = await req.json();
    if (!credentialName || !login || !password) {
        throw new BadRequestError("Por favor, insira um nome para a credencial, login e senha")
    }

    await createCredential(config.db, {
        credentialName: credentialName,
        login: login,
        password: password,
        userID: userID
    })
    return respondWithJSON(200, { message: "Credencial criada com sucesso" })
}

export async function handlerUpdateCredential(config: ApiConfig, req: BunRequest) {
    const token = getBearerToken(req.headers) as string;
    const userID = validateJWT(token, config.jwtSecret);
    if (!userID) {
        throw new UserNotAuthenticatedError("Invalid token")
    }

    const { credentialName, login, password } = await req.json();
    if (!credentialName || !login || !password) {
        throw new BadRequestError("Por favor, insira um nome para a credencial, login e senha")
    }

    const credential = await getCredentialByName(config.db, credentialName)
    if (!credential || credential.userID !== userID) {
        throw new BadRequestError("Credencial não encontrada")
    }

    await updateCredential(config.db, {
        credentialName: credentialName,
        login: login,
        password: password,
        userID: userID
    });
}