import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";
import {
  createSchedule,
  listAllSchedules,
  getScheduleByID,
  updateSchedule,
  deleteSchedule,
  type CreateScheduleParams,
  type UpdateScheduleParams,
} from "../db/schedules";
import { BadRequestError, InternalServerError, NotFoundError, UserForbiddenError } from "./errors";
import { respondWithJSON } from "./json";

export async function handlerCreateSchedule(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const body = await req.json();

    if (!body.robotInstanceID) throw new BadRequestError("robotInstanceID is required");
    if (!body.scheduleName) throw new BadRequestError("scheduleName is required");
    if (!body.cronExpression) throw new BadRequestError("cronExpression is required");

    const params: CreateScheduleParams = {
        robotInstanceID: body.robotInstanceID,
        userID,
        scheduleName: body.scheduleName,
        cronExpression: body.cronExpression,
        timezone: body.timezone ?? "America/Sao_Paulo",
        isActive: body.isActive === undefined ? true : !!body.isActive,
        lastExecutionAt: body.lastExecutionAt ? new Date(body.lastExecutionAt) : null,
        nextExecutionAt: body.nextExecutionAt ? new Date(body.nextExecutionAt) : null,
        description: body.description ?? null,
        maxRetries: body.maxRetries ?? 3,
        retryDelayMinutes: body.retryDelayMinutes ?? 5,
    };

    const schedule = await createSchedule(config.db, params);
    return respondWithJSON(201, schedule);
}

export async function handlerListAllSchedules(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const schedules = await listAllSchedules(config.db, userID);
    return respondWithJSON(200, schedules);
}

export async function handlerGetScheduleByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const scheduleID = pathParts[pathParts.length - 1];

    if (!scheduleID) throw new BadRequestError("Schedule ID is required");

    const schedule = await getScheduleByID(config.db, scheduleID);
    if (!schedule) throw new NotFoundError("Schedule not found");
    if (schedule.userID !== userID) throw new UserForbiddenError("Forbidden");

    return respondWithJSON(200, schedule);
}

export async function handlerLDeleteSchedule(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const scheduleID = pathParts[pathParts.length - 1];

    if (!scheduleID) throw new BadRequestError("Schedule ID is required");

    const schedule = await getScheduleByID(config.db, scheduleID);
    if (!schedule) throw new NotFoundError("Schedule not found");
    if (schedule.userID !== userID) throw new UserForbiddenError("Forbidden");

    const deleted = await deleteSchedule(config.db, scheduleID, userID);
    if (!deleted) throw new InternalServerError("Failed to delete schedule");

    return respondWithJSON(204, {});
}

export async function handlerUpdateSchedule(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const scheduleID = pathParts[pathParts.length - 1];

    if (!scheduleID) throw new BadRequestError("Schedule ID is required");

    const existing = await getScheduleByID(config.db, scheduleID);
    if (!existing) throw new NotFoundError("Schedule not found");
    if (existing.userID !== userID) throw new UserForbiddenError("Forbidden");

    const body = await req.json();

    const params: UpdateScheduleParams = {};
    if (body.scheduleName !== undefined) params.scheduleName = body.scheduleName;
    if (body.cronExpression !== undefined) params.cronExpression = body.cronExpression;
    if (body.timezone !== undefined) params.timezone = body.timezone;
    if (body.isActive !== undefined) params.isActive = !!body.isActive;
    if (body.lastExecutionAt !== undefined) params.lastExecutionAt = body.lastExecutionAt ? new Date(body.lastExecutionAt) : null;
    if (body.nextExecutionAt !== undefined) params.nextExecutionAt = body.nextExecutionAt ? new Date(body.nextExecutionAt) : null;
    if (body.description !== undefined) params.description = body.description;
    if (body.maxRetries !== undefined) params.maxRetries = body.maxRetries;
    if (body.retryDelayMinutes !== undefined) params.retryDelayMinutes = body.retryDelayMinutes;

    const updated = await updateSchedule(config.db, scheduleID, userID, params);
    return respondWithJSON(200, updated);
}