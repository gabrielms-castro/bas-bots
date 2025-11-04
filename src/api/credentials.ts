import { password, type BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { respondWithJSON } from "./json";
import { BadRequestError, UserNotAuthenticatedError } from "./errors";
import { createCredential, deleteCredential, getCredentialByID, getCredentialByName, getCredentials, updateCredential, type UpdateCredentialParams } from "../db/credentials";
import { getBearerToken, validateJWT } from "../auth";

export async function handlerCreateCredential(config: ApiConfig, req: BunRequest) {
    const token = getBearerToken(req.headers) as string;
    const userID = validateJWT(token, config.jwtSecret);
    if (!userID) {
        throw new UserNotAuthenticatedError("Invalid token")
    }

    const { groupName, credentialName, login, password } = await req.json();
    if (!groupName ||!credentialName || !login || !password) {
        throw new BadRequestError("Por favor, insira um nome para a credencial, login e senha")
    }

    const result = await createCredential(config.db, {
        groupName: groupName,
        credentialName: credentialName,
        login: login,
        password: password,
        userID: userID
    })

    if (!result) {
         throw new BadRequestError(`Não foi possível criar a credencial`);
    }

    return respondWithJSON(200, result);
}

export async function handlerGetCredential(config: ApiConfig, req: BunRequest) {
    const token = getBearerToken(req.headers) as string;
    const userID = validateJWT(token, config.jwtSecret);
    if (!userID) throw new UserNotAuthenticatedError("Invalid token");

    const url = new URL(req.url);
    const credentialName = url.searchParams.get("credentialName");
    
    if (!credentialName) {
        const credentials = await getCredentials(config.db, userID);
        if (!credentials) throw new BadRequestError("Credencial não encontrada");
            return respondWithJSON(200, credentials);
    }

    const credential = await getCredentialByName(config.db, userID, credentialName);
    if (!credential) throw new BadRequestError("Credencial não encontrada");

    return respondWithJSON(200, credential);
}


export async function handlerUpdateCredential(config: ApiConfig, req: BunRequest) {
    const token = getBearerToken(req.headers) as string;
    const userID = validateJWT(token, config.jwtSecret);
    if (!userID) throw new UserNotAuthenticatedError("Invalid token");

    type CredParams = { credentialID: string };
    const params = req.params as unknown as CredParams | undefined;
    const credentialID = params?.credentialID
    if (!credentialID) throw new BadRequestError("ID inválido");

    const body = (await req.json()) as UpdateCredentialParams;
    if (!body || Object.keys(body).length === 0) {
        throw new BadRequestError("Nenhum campo para atualizar");
    }

    const credential = await getCredentialByID(config.db, credentialID);
    if (!credential || credential.userID !== userID) {
        throw new BadRequestError("Credencial não encontrada");
    }

    const { changes } = await updateCredential(config.db, credentialID, userID, body);
    if (changes === 0) {
        throw new BadRequestError("Nenhuma alteração aplicada");
    }

    const result = await getCredentialByID(config.db, credentialID)
    if (!result) throw new BadRequestError("Não encontrado")

    return respondWithJSON(200, result);
}

export async function handlerDeleteCredential(config: ApiConfig, req: BunRequest) {
    const token = getBearerToken(req.headers) as string;
    const userID = validateJWT(token, config.jwtSecret);
    if (!userID) throw new UserNotAuthenticatedError("Invalid token"); 
    
    type CredParams = { credentialID: string };
    const params = req.params as unknown as CredParams | undefined;
    const credentialID = params?.credentialID
    if (!credentialID) throw new BadRequestError("ID inválido");
    
    const result = await deleteCredential(config.db, userID, credentialID)
    return respondWithJSON(204, result)
}

export async function handlerGetCredentialByID(config: ApiConfig, req: BunRequest) {
    const token = getBearerToken(req.headers) as string;
    const userID = validateJWT(token, config.jwtSecret);
    if (!userID) throw new UserNotAuthenticatedError("Invalid token"); 
    
    type CredParams = { credentialID: string };
    const params = req.params as unknown as CredParams | undefined;
    const credentialID = params?.credentialID
    if (!credentialID) throw new BadRequestError("ID inválido");    
    
    const result = await getCredentialByID(config.db, credentialID)
    if (!result) throw new BadRequestError("Não encontrado")

    return respondWithJSON(200, result);    
}