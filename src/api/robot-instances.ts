import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";

export async function handlerCreateRobotInstance(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerlistAllRobotIntancesByUserID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerGetRobotInstanceByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerDeleteRobotInstance(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}