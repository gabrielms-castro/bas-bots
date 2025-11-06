import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";
import {
  createExtension,
  listExtensionsByUserID,
  getExtensionByID,
  getExtensionByName,
  updateExtension,
  deleteExtension,
  type CreateExtensionParams,
  type UpdateExtensionParams,
} from "../db/extensions";
import { BadRequestError, InternalServerError, NotFoundError, UserForbiddenError } from "./errors";
import { respondWithJSON } from "./json";
import { decrypt, encrypt } from "../services/crypto.service";

export async function handlerCreateExtension(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const body = await req.json();
    if (!body.extensionName) throw new BadRequestError("extensionName is required");

    // if (body.extensionUrl) {
    //     try {
    //         new URL(body.extensionUrl);
    //     } catch {
    //     throw new BadRequestError("extensionUrl must be a valid URL");
    //     }
    // }

    const existing = await getExtensionByName(config.db, userID, body.extensionName);
    if (existing) throw new BadRequestError("Extension with this name already exists");

    let encryptedPassword;
    let encryptedPin;
    if (body.password) encryptedPassword = encrypt(body.password);
    if (body.pin)encryptedPin = encrypt(body.pin);

    const params: CreateExtensionParams = {
        extensionName: body.extensionName,
        description: body.description ?? null,
        login: body.login ?? null,
        password: encryptedPassword ?? null,
        pin: encryptedPin ?? null,
        extensionURL: body.extensionURL ?? null,
        userID,
        isActive: body.isActive === undefined ? true : !!body.isActive,
    };

    const extension = await createExtension(config.db, params);
    return respondWithJSON(201, extension);
}

export async function handlerListExtensions(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const extensions = await listExtensionsByUserID(config.db, userID);
    return respondWithJSON(200, extensions);
}

export async function handlerGetExtensionByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const extensionID = pathParts[pathParts.length - 1];

    if (!extensionID) throw new BadRequestError("Extension ID is required");

    const extension = await getExtensionByID(config.db, extensionID);
    if (!extension) throw new NotFoundError("Extension not found");
    if (extension.userID !== userID) throw new UserForbiddenError("Forbidden");
    if (extension.password !== null ) extension.password = decrypt(extension.password);
    if (extension.pin !== null ) extension.pin = decrypt(extension.pin);
    
    return respondWithJSON(200, extension);
}

export async function handlerUpdateExtension(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const extensionID = pathParts[pathParts.length - 1];

    if (!extensionID) throw new BadRequestError("Extension ID is required");

    const existing = await getExtensionByID(config.db, extensionID);
    if (!existing) throw new NotFoundError("Extension not found");
    if (existing.userID !== userID) throw new UserForbiddenError("Forbidden");

    const body = await req.json();

    // if (body.extensionUrl !== undefined && body.extensionUrl !== null) {
    //     try {
    //     new URL(body.extensionUrl);
    //     } catch {
    //     throw new BadRequestError("extensionUrl must be a valid URL");
    //     }
    // }

    if (body.extensionName && body.extensionName !== existing.extensionName) {
        const conflict = await getExtensionByName(config.db, userID, body.extensionName);
        if (conflict) throw new BadRequestError("Extension with this name already exists");
    }

    const params: UpdateExtensionParams = {};
    if (body.extensionName !== undefined) params.extensionName = body.extensionName;
    if (body.description !== undefined) params.description = body.description;
    if (body.login !== undefined) params.login = body.login;
    if (body.password !== undefined) params.password = body.password;
    if (body.pin !== undefined) params.pin = body.pin;
    if (body.extensionURL !== undefined) params.extensionURL = body.extensionURL;
    if (body.isActive !== undefined) params.isActive = !!body.isActive;

    const updated = await updateExtension(config.db, extensionID, userID, params);
    return respondWithJSON(200, updated);
}

export async function handlerDeleteExtension(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const extensionID = pathParts[pathParts.length - 1];

    if (!extensionID) throw new BadRequestError("Extension ID is required");

    const extension = await getExtensionByID(config.db, extensionID);
    if (!extension) throw new NotFoundError("Extension not found");
    if (extension.userID !== userID) throw new UserForbiddenError("Forbidden");

    const deleted = await deleteExtension(config.db, extensionID, userID);
    if (!deleted) throw new InternalServerError("Failed to delete extension");

    return new Response(null, { status: 204 });
}