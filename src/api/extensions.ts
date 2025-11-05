import type { ApiConfig } from "../config";
import type { AuthenticatedRequest } from "./middleware";

export async function handlerCreateExtension(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerlistAllExtension(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerGetExtensionByID(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerDeleteExtension(config: ApiConfig, req: AuthenticatedRequest) {
    const userID = req.user.id
}

export async function handlerUpdateExtension(config: ApiConfig, req: AuthenticatedRequest) {
    // to be implemented
}