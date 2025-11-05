import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";

export async function handlerCreateRobot(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function listAllRobots(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function getRobotByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function deleteRobot(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function updateRobot(config: ApiConfig, req: AuthenticatedRequest) {
    // to be implemented
}