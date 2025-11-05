import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";

export async function handlerCreateRobot(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerListAllRobots(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerGetRobotByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerLDeleteRobot(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerLUpdateRobot(config: ApiConfig, req: AuthenticatedRequest) {
    // to be implemented
}