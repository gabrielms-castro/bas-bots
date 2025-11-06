import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";
import {
  createRobot,
  listAllRobots,
  getRobotByID,
  updateRobot,
  deleteRobot,
  type CreateRobotParams,
  type UpdateRobotParams,
} from "../db/robots";
import { BadRequestError, InternalServerError, NotFoundError } from "./errors";
import { respondWithJSON } from "./json";

export async function handlerCreateRobot(config: ApiConfig, req: AuthenticatedRequest) {
    const body = await req.json();

    if (!body.robotName || !body.robotType || !body.description || !body.sourceFilePath) {
        throw new BadRequestError("robotName, robotType, description and sourceFilePath are required");
    }

    const params: CreateRobotParams = {
        robotName: body.robotName,
        robotType: body.robotType,
        description: body.description,
        requiresCredential: !!body.requiresCredential,
        requiresExtension: !!body.requiresExtension,
        supportedExtensions: body.supportedExtensions ?? null,
        sourceFilePath: body.sourceFilePath,
        parametersSchema: body.parametersSchema ?? null,
        version: body.version ?? "1.0.0",
        isActive: body.isActive === undefined ? true : !!body.isActive,
    };

    const robot = await createRobot(config.db, params);
    return respondWithJSON(201, robot);
}

export async function handlerListAllRobots(config: ApiConfig, _req: AuthenticatedRequest) {
    const robots = await listAllRobots(config.db);
    return respondWithJSON(200, robots);
}

export async function handlerGetRobotByID(config: ApiConfig, req: AuthenticatedRequest) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const robotID = pathParts[pathParts.length - 1];

    if (!robotID) throw new BadRequestError("Robot ID is required");
    const robot = await getRobotByID(config.db, robotID);
    if (!robot) throw new NotFoundError("Robot not found");

    return respondWithJSON(200, robot);
}

export async function handlerLDeleteRobot(config: ApiConfig, req: AuthenticatedRequest) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const robotID = pathParts[pathParts.length - 1];

    if (!robotID) throw new BadRequestError("Robot ID is required");

    const robot = await getRobotByID(config.db, robotID);
    if (!robot) throw new NotFoundError("Robot not found");

    const deleted = await deleteRobot(config.db, robotID);
    if (!deleted) throw new InternalServerError("Failed to delete robot");

    return new Response(null, { status: 204 });
}

export async function handlerUpdateRobot(config: ApiConfig, req: AuthenticatedRequest) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const robotID = pathParts[pathParts.length - 1];

    if (!robotID) throw new BadRequestError("Robot ID is required");

    const existing = await getRobotByID(config.db, robotID);
    if (!existing) throw new NotFoundError("Robot not found");

    const body = await req.json();

    const params: UpdateRobotParams = {};
    if (body.robotName !== undefined) params.robotName = body.robotName;
    if (body.robotType !== undefined) params.robotType = body.robotType;
    if (body.description !== undefined) params.description = body.description;
    if (body.requiresCredential !== undefined) params.requiresCredential = !!body.requiresCredential;
    if (body.requiresExtension !== undefined) params.requiresExtension = !!body.requiresExtension;
    if (body.supportedExtensions !== undefined) params.supportedExtensions = body.supportedExtensions;
    if (body.sourceFilePath !== undefined) params.sourceFilePath = body.sourceFilePath;
    if (body.parametersSchema !== undefined) params.parametersSchema = body.parametersSchema;
    if (body.version !== undefined) params.version = body.version;
    if (body.isActive !== undefined) params.isActive = !!body.isActive;

    const updated = await updateRobot(config.db, robotID, params);
    return respondWithJSON(200, updated);
}