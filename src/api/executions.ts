import type { ApiConfig } from '../config';
import type { AuthenticatedRequest } from './middleware';
import {
  createExecution,
  listExecutionsByUserID,
  listExecutionsByRobotInstanceID,
  listExecutionsByStatus,
  getExecutionByID,
  updateExecution,
  deleteExecution,
  type CreateExecutionParams,
  type UpdateExecutionParams,
} from '../db/executions';

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UserForbiddenError,
} from './errors';

import { respondWithJSON } from './json';
import { ExecutionService } from '../services/execution.service';

export async function handlerCreateExecution(
  config: ApiConfig,
  req: AuthenticatedRequest,
): Promise<Response> {
  const userID = req.user.id;
  const body = await req.json();

  const params = {
    robotInstanceID: body.robotInstanceID,
    userID: userID,
    executionType: body.executionType,
    scheduleID: body.scheduleID || null,
  };

  const executionService = new ExecutionService(config);
  const execution = await executionService.createExecution(params);

  return respondWithJSON(201, execution);
}

export async function handlerListAllExecutions(
  config: ApiConfig,
  req: AuthenticatedRequest,
): Promise<Response> {
  const userID = req.user.id;
  const url = new URL(req.url);
  const robotInstanceID = url.searchParams.get('robotInstanceID');
  const status = url.searchParams.get('status');

  let executions;
  if (robotInstanceID) {
    executions = await listExecutionsByRobotInstanceID(
      config.db,
      userID,
      robotInstanceID,
    );
  } else if (status) {
    executions = await listExecutionsByStatus(config.db, userID, status as any);
  } else {
    executions = await listExecutionsByUserID(config.db, userID);
  }

  return respondWithJSON(200, executions);
}

export async function handlerGetExecutionByID(
  config: ApiConfig,
  req: AuthenticatedRequest,
): Promise<Response> {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const executionID = pathParts[pathParts.length - 1];

  if (!executionID) throw new BadRequestError('Execution ID is required');

  const execution = await getExecutionByID(config.db, executionID);
  if (!execution) throw new BadRequestError('Execution not found');
  if (execution.userID !== userID) throw new UserForbiddenError('Forbidden');

  return respondWithJSON(200, execution);
}

export async function handlerUpdateExecution(
  config: ApiConfig,
  req: AuthenticatedRequest,
): Promise<Response> {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const executionID = pathParts[pathParts.length - 1];
  if (!executionID) throw new BadRequestError('Execution ID is required');

  const execution = await getExecutionByID(config.db, executionID);
  if (!execution) throw new NotFoundError('Execution not found');
  if (execution.userID !== userID) throw new UserForbiddenError('Forbidden');

  const body = await req.json();

  const params: UpdateExecutionParams = {};
  if (body.status !== undefined) params.status = body.status;
  if (body.startedAt !== undefined) params.startedAt = new Date(body.startedAt);
  if (body.finishedAt !== undefined)
    params.finishedAt = new Date(body.finishedAt);
  if (body.errorMessage !== undefined) params.errorMessage = body.errorMessage;
  if (body.errorStack !== undefined) params.errorStack = body.errorStack;
  if (body.outputDataJson !== undefined)
    params.outputDataJson = body.outputDataJson;
  if (body.outputFilePath !== undefined)
    params.outputFilePath = body.outputFilePath;
  if (body.logsFilePath !== undefined) params.logsFilePath = body.logsFilePath;
  if (body.retryCount !== undefined) params.retryCount = body.retryCount;
  if (body.durationSeconds !== undefined)
    params.durationSeconds = body.durationSeconds;

  const updatedExecution = await updateExecution(
    config.db,
    executionID,
    userID,
    params,
  );

  return respondWithJSON(200, updatedExecution);
}

export async function handlerDeleteExecution(
  config: ApiConfig,
  req: AuthenticatedRequest,
): Promise<Response> {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const executionID = pathParts[pathParts.length - 1];
  if (!executionID) throw new BadRequestError('Execution ID is required');

  const execution = await getExecutionByID(config.db, executionID);
  if (!execution) throw new NotFoundError('Execution not found');
  if (execution.userID !== userID) throw new UserForbiddenError('Forbidden');

  const deleted = await deleteExecution(config.db, userID, executionID);

  if (!deleted) throw new InternalServerError('Failed to delete execution');

  return respondWithJSON(204, {});
}
