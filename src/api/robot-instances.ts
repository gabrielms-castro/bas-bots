import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";
import {
  createRobotInstance,
  listAllRobotInstancesByUser,
  getRobotInstanceByID,
  updateRobotInstance,
  deleteRobotInstance,
  type CreateRobotInstanceParams,
  type UpdateRobotInstanceParams,
} from "../db/robot-instances";
import { BadRequestError, InternalServerError, NotFoundError, UserForbiddenError } from "./errors";
import { respondWithJSON } from "./json";

export async function handlerCreateRobotInstance(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const body = await req.json();

    if (!body.instanceName || !body.robotID) {
        throw new BadRequestError("instanceName and robotID are required");
    }

    const hasCredential = !!body.credentialID;
    const hasExtension = !!body.extensionID;

    if (hasCredential === hasExtension) {
        throw new BadRequestError("Exactly one of credentialID or extensionID must be provided");
    }

    const params: CreateRobotInstanceParams = {
        instanceName: body.instanceName,
        description: body.description ?? null,
        robotID: body.robotID,
        userID,
        credentialID: body.credentialID ?? null,
        extensionID: body.extensionID ?? null,
        isActive: body.isActive === undefined ? true : !!body.isActive,
        parametersJSON: body.parametersJSON ?? null,
    };

    const instance = await createRobotInstance(config.db, params);
    return respondWithJSON(201, instance);
}

export async function handlerListAllRobotInstancesByUserID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const instances = await listAllRobotInstancesByUser(config.db, userID);
    return respondWithJSON(200, instances);
}

export async function handlerGetRobotInstanceByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const instanceID = pathParts[pathParts.length - 1];

    if (!instanceID) throw new BadRequestError("Robot Instance ID is required");

    const instance = await getRobotInstanceByID(config.db, instanceID);
    if (!instance) throw new NotFoundError("Robot Instance not found");
    if (instance.userID !== userID) throw new UserForbiddenError("Forbidden");

    return respondWithJSON(200, instance);
}

export async function handlerUpdateRobotInstance(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const instanceID = pathParts[pathParts.length - 1];

    if (!instanceID) throw new BadRequestError("Robot Instance ID is required");

    const existing = await getRobotInstanceByID(config.db, instanceID);
    if (!existing) throw new NotFoundError("Robot Instance not found");
    if (existing.userID !== userID) throw new UserForbiddenError("Forbidden");

    const body = await req.json();

    // Validação do CHECK constraint se credentialID ou extensionID forem alterados
    const newCredentialID = body.credentialID !== undefined ? body.credentialID : existing.credentialID;
    const newExtensionID = body.extensionID !== undefined ? body.extensionID : existing.extensionID;

    const hasCredential = !!newCredentialID;
    const hasExtension = !!newExtensionID;

    if (hasCredential === hasExtension) {
        throw new BadRequestError("Exactly one of credentialID or extensionID must be set");
    }

    const params: UpdateRobotInstanceParams = {};
    if (body.instanceName !== undefined) params.instanceName = body.instanceName;
    if (body.description !== undefined) params.description = body.description;
    if (body.credentialID !== undefined) params.credentialID = body.credentialID;
    if (body.extensionID !== undefined) params.extensionID = body.extensionID;
    if (body.isActive !== undefined) params.isActive = !!body.isActive;
    if (body.parametersJSON !== undefined) params.parametersJSON = body.parametersJSON;

    const updated = await updateRobotInstance(config.db, instanceID, userID, params);
    return respondWithJSON(200, updated);
}

export async function handlerDeleteRobotInstance(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const instanceID = pathParts[pathParts.length - 1];

    if (!instanceID) throw new BadRequestError("Robot Instance ID is required");

    const instance = await getRobotInstanceByID(config.db, instanceID);
    if (!instance) throw new NotFoundError("Robot Instance not found");
    if (instance.userID !== userID) throw new UserForbiddenError("Forbidden");

    const deleted = await deleteRobotInstance(config.db, instanceID, userID);
    if (!deleted) throw new InternalServerError("Failed to delete robot instance");

    return new Response(null, { status: 204 });
}