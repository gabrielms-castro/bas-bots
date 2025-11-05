import { password, type BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { respondWithJSON } from "./json";
import { BadRequestError, UserNotAuthenticatedError } from "./errors";
import { createCredential, deleteCredential, getCredentialByID, getCredentialByName, getCredentials, updateCredential, type UpdateCredentialParams } from "../db/credentials";
import { getBearerToken, validateJWT } from "../auth";
import type { AuthenticatedRequest } from "./middleware";
import { decrypt, encrypt } from "../crypto";
import { REFUSED } from "dns";

export async function handlerCreateCredential(config: ApiConfig, req: AuthenticatedRequest) {

    const userID = req.user.id
    const { groupName, credentialName, login, password } = await req.json();
    if (!groupName ||!credentialName || !login || !password) {
        throw new BadRequestError("Por favor, insira um nome para a credencial, login e senha")
    }

    const queryCredential = await getCredentialByName(config.db, userID, credentialName)
    if (queryCredential) {
        throw new BadRequestError(`A credencial ${credentialName} já existe`)
    }
    const encryptedPassword = encrypt(password);
    const result = await createCredential(config.db, {
        groupName: groupName,
        credentialName: credentialName,
        login: login,
        password: encryptedPassword,
        userID: userID
    })

    if (!result) {
         throw new BadRequestError(`Não foi possível criar a credencial`);
    }

    return respondWithJSON(200, result);
}

export async function handlerGetCredential(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
    const url = new URL(req.url);
    const credentialName = url.searchParams.get("credentialName");
    
    if (!credentialName) {
        const credentials = await getCredentials(config.db, userID)
        if (!credentials) throw new BadRequestError("Credencial não encontrada");
        
        const decryptedCredentials = credentials.map((credential) => ({
            ...credential,
            password: decrypt(credential.password),
        }));
        
        return respondWithJSON(200, decryptedCredentials);
    }

    const credential = await getCredentialByName(config.db, userID, credentialName);
    if (!credential) throw new BadRequestError("Credencial não encontrada");
    credential.password = decrypt(credential.password)
    return respondWithJSON(200, credential);
}


export async function handlerUpdateCredential(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id

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

export async function handlerDeleteCredential(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
    
    type CredParams = { credentialID: string };
    const params = req.params as unknown as CredParams | undefined;
    const credentialID = params?.credentialID
    if (!credentialID) throw new BadRequestError("ID inválido");
    
    const result = await deleteCredential(config.db, userID, credentialID)
    return respondWithJSON(204, result)
}

export async function handlerGetCredentialByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
    
    type CredParams = { credentialID: string };
    const params = req.params as unknown as CredParams | undefined;
    const credentialID = params?.credentialID
    if (!credentialID) throw new BadRequestError("ID inválido");    
    
    const result = await getCredentialByID(config.db, credentialID)
    if (!result) throw new BadRequestError("Não encontrado")
    if (result.userID !== userID) throw new BadRequestError("Credencial nao encontrada")

    result.password = decrypt(result.password)
    return respondWithJSON(200, result);    
}