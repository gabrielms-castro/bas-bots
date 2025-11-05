import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";

import { 
    BadRequestError, 
    NotFoundError, 
    UserForbiddenError, 
    UserNotAuthenticatedError 
} from "./errors";

import { respondWithJSON } from "./json";

import { 
    getBearerToken, 
    validateJWT 
} from "../auth";

type HandlerWithConfig = (config: ApiConfig, req: BunRequest) => Promise<Response>;

export type AuthenticatedRequest = BunRequest & {
    user: {
        id: string;
    }
}

export function withConfig(config: ApiConfig, handler: HandlerWithConfig) {
    return (req: BunRequest) => handler(config, req)
}

export function withAuth(handler: (config: ApiConfig, req: AuthenticatedRequest) => Promise<Response>) {
    return async (config: ApiConfig, req: BunRequest) => {
        const token = getBearerToken(req.headers) as string;
        const userID = validateJWT(token, config.jwtSecret);
        
        if (!userID) {
            throw new UserNotAuthenticatedError("Token inválido");
        }
        
        // Anexar user ao request
        (req as AuthenticatedRequest).user = { id: userID };
        
        return handler(config, req as AuthenticatedRequest);
    };
}

export function errorHandlingMiddleware(config: ApiConfig, err: unknown): Response {
    let statusCode = 500;
    let message = "Something went wrong on our end."
    if (err instanceof BadRequestError) {
        statusCode = 400;
        message = err.message;
    } else if (err instanceof UserNotAuthenticatedError) {
        statusCode = 401;
        message = err.message;
    } else if (err instanceof UserForbiddenError) {
        statusCode = 403;
        message = err.message;
    } else if (err instanceof NotFoundError) {
        statusCode = 404;
        message = err.message;
    }
    return respondWithJSON(statusCode, { error: message });
    
}