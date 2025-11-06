import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";
import {
  createExecutionLog,
  listExecutionLogsByExecutionID,
  listExecutionLogsByLevel,
  getExecutionLogByID,
  verifyExecutionLogOwnership,
  deleteExecutionLog,
  deleteExecutionLogsByExecutionID,
  type CreateExecutionLogParams,
  type ExecutionLog,
} from "../db/execution-logs";
import { BadRequestError, InternalServerError, NotFoundError, UserForbiddenError } from "./errors";
import { respondWithJSON } from "./json";

const VALID_LOG_LEVELS: ExecutionLog["logLevel"][] = ["debug", "info", "warn", "error", "fatal"];

function isValidLogLevel(level: string): level is ExecutionLog["logLevel"] {
  return VALID_LOG_LEVELS.includes(level as any);
}

export async function handlerCreateExecutionLog(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const body = await req.json();

    if (!body.executionID || !body.logLevel || !body.message) {
        throw new BadRequestError("executionID, logLevel and message are required");
    }

    if (!isValidLogLevel(body.logLevel)) {
        throw new BadRequestError(`logLevel must be one of: ${VALID_LOG_LEVELS.join(", ")}`);
    }

    const executionCheckSQL = `SELECT user_id FROM executions WHERE id = ?`;
    const execution = config.db.query<{ user_id: string }, [string]>(executionCheckSQL).get(body.executionID);
    
    if (!execution) throw new NotFoundError("Execution not found");
    if (execution.user_id !== userID) throw new UserForbiddenError("Forbidden");

    const params: CreateExecutionLogParams = {
        executionID: body.executionID,
        logLevel: body.logLevel,
        message: body.message,
        contextJSON: body.contextJSON ?? null,
    };

    const log = await createExecutionLog(config.db, params);
    return respondWithJSON(201, log);
}

export async function handlerListExecutionLogs(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const executionID = url.searchParams.get("executionID");
    const logLevel = url.searchParams.get("logLevel");

    let logs;

    if (executionID) {
        logs = await listExecutionLogsByExecutionID(config.db, executionID, userID);
    } else if (logLevel) {
        if (!isValidLogLevel(logLevel)) {
        throw new BadRequestError(`logLevel must be one of: ${VALID_LOG_LEVELS.join(", ")}`);
        }
        logs = await listExecutionLogsByLevel(config.db, userID, logLevel);
    } else {
        throw new BadRequestError("executionID or logLevel query parameter is required");
    }

    return respondWithJSON(200, logs);
}

export async function handlerGetExecutionLogByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const logID = pathParts[pathParts.length - 1];

    if (!logID) throw new BadRequestError("Execution Log ID is required");

    const log = await getExecutionLogByID(config.db, logID);
    if (!log) throw new NotFoundError("Execution Log not found");

    const hasOwnership = await verifyExecutionLogOwnership(config.db, logID, userID);
    if (!hasOwnership) throw new UserForbiddenError("Forbidden");

    return respondWithJSON(200, log);
}

export async function handlerDeleteExecutionLog(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const logID = pathParts[pathParts.length - 1];

    if (!logID) throw new BadRequestError("Execution Log ID is required");

    const log = await getExecutionLogByID(config.db, logID);
    if (!log) throw new NotFoundError("Execution Log not found");

    const hasOwnership = await verifyExecutionLogOwnership(config.db, logID, userID);
    if (!hasOwnership) throw new UserForbiddenError("Forbidden");

    const deleted = await deleteExecutionLog(config.db, logID, userID);
    if (!deleted) throw new InternalServerError("Failed to delete execution log");

    return new Response(null, { status: 204 });
}

export async function handlerDeleteExecutionLogsByExecutionID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const executionID = url.searchParams.get("executionID");

    if (!executionID) throw new BadRequestError("executionID query parameter is required");

    const deletedCount = await deleteExecutionLogsByExecutionID(config.db, executionID, userID);

    return respondWithJSON(200, { deleted: deletedCount });
}