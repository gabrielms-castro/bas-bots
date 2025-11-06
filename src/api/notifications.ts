import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";

export async function handlerCreateNotification(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerListAllNotifications(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerGetNotificationByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerLDeleteNotification(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerUpdateNotification(config: ApiConfig, req: AuthenticatedRequest) {
    // to be implemented
}