import spa from "./app/index.html"

import { handlerLogin, handlerRefreshToken, handlerRevoke } from "./api/auth";
import { 
    errorHandlingMiddleware, 
    withAuth, 
    withConfig
} from "./api/middleware";

import { 
    config, 
    type ApiConfig 
} from "./config";

import { handlerCreateUser } from "./api/users";
import { handlerReset } from "./api/reset";
import { 
    handlerCreateCredential, 
    handlerDeleteCredential, 
    handlerGetCredential, 
    handlerGetCredentialByID, 
    handlerUpdateCredential 
} from "./api/credentials";

import { handlerCreateExecution, handlerDeleteExecution, handlerGetExecutionByID, handlerListAllExecutions, handlerUpdateExecution } from "./api/executions";
import { handlerCreateSchedule, handlerGetScheduleByID, handlerLDeleteSchedule, handlerListAllSchedules, handlerUpdateSchedule } from "./api/schedules";
import { handlerCreateRobot, handlerGetRobotByID, handlerLDeleteRobot, handlerListAllRobots, handlerUpdateRobot } from "./api/robots";
import { handlerCreateRobotInstance, handlerDeleteRobotInstance, handlerGetRobotInstanceByID, handlerListAllRobotInstancesByUserID, handlerUpdateRobotInstance } from "./api/robot-instances";
import { handlerCreateExecutionLog, handlerDeleteExecutionLog, handlerDeleteExecutionLogsByExecutionID, handlerGetExecutionLogByID } from "./api/execution-logs";

Bun.serve({
    port: Number(config.port),
    development: config.platform === 'dev',
    routes: {
        "/": spa,

        "/api/login": {
            POST: withConfig(config, handlerLogin),
        },

        "/api/users": {
            POST: withConfig(config, handlerCreateUser),
        },

        "/api/refresh": {
            POST: withConfig(config, handlerRefreshToken),
        },

        "/api/revoke": {
            POST: withConfig(config, handlerRevoke),
        },

        "/api/reset": {
            POST: withConfig(config, handlerReset),
        },

        "/api/credentials": {
            GET: withConfig(config, withAuth(handlerGetCredential)), // Aceita credentialName como searchParams
            POST: withConfig(config, withAuth(handlerCreateCredential)),
        },

        "/api/credentials/:credentialID": {
            GET: withConfig(config, withAuth(handlerGetCredentialByID)),
            DELETE: withConfig(config, withAuth(handlerDeleteCredential)),
            PATCH: withConfig(config, withAuth(handlerUpdateCredential)),
        },

        "/api/robots": {
            GET: withConfig(config, withAuth(handlerListAllRobots)),
            POST: withConfig(config, withAuth(handlerCreateRobot)),
        },

        "/api/robots/:robotID": {
            GET: withConfig(config, withAuth(handlerGetRobotByID)),
            DELETE: withConfig(config, withAuth(handlerLDeleteRobot)),
            PATCH: withConfig(config, withAuth(handlerUpdateRobot)),
        },       

        "/api/robot-instances": {
            GET: withConfig(config, withAuth(handlerListAllRobotInstancesByUserID)),
            POST: withConfig(config, withAuth(handlerCreateRobotInstance)),
        },

        "/api/robot-instances/:instanceID": {
            GET: withConfig(config, withAuth(handlerGetRobotInstanceByID)),
            DELETE: withConfig(config, withAuth(handlerDeleteRobotInstance)),
            PATCH: withConfig(config, withAuth(handlerUpdateRobotInstance)),
        },

        "/api/executions": {
            GET: withConfig(config, withAuth(handlerListAllExecutions)), // Aceita status ou robotInstanceID como searchParams
            POST: withConfig(config, withAuth(handlerCreateExecution)), // execução criada envia um evento parao service de robo (?)
        },

        "/api/executions/:executionID": {
            GET: withConfig(config, withAuth(handlerGetExecutionByID)),
            DELETE: withConfig(config, withAuth(handlerDeleteExecution)),
            PATCH: withConfig(config, withAuth(handlerUpdateExecution)),
        },

        "/api/schedules": {
            GET: withConfig(config, withAuth(handlerListAllSchedules)),
            POST: withConfig(config, withAuth(handlerCreateSchedule)),
        },

        "/api/schedules/:scheduleID": {
            GET: withConfig(config, withAuth(handlerGetScheduleByID)),
            DELETE: withConfig(config, withAuth(handlerLDeleteSchedule)),
            PATCH: withConfig(config, withAuth(handlerUpdateSchedule)),
        },

        "/api/execution-logs": {
            GET: withConfig(config, withAuth(handlerListAllExecutions)), // ?executionID=... ou ?logLevel=...
            POST: withConfig(config, withAuth(handlerCreateExecutionLog)),
            DELETE: withConfig(config, withAuth(handlerDeleteExecutionLogsByExecutionID)), // ?executionID=... (bulk delete)
        },
        "/api/execution-logs/:logID": {
            GET: withConfig(config, withAuth(handlerGetExecutionLogByID)),
            DELETE: withConfig(config, withAuth(handlerDeleteExecutionLog)),
        }        

    },
    error(err) {
        return errorHandlingMiddleware(config, err)
    }
});
console.log(`Server running at http://localhost:${config.port}`);

