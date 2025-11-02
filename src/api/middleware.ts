import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { 
    BadRequestError, 
    NotFoundError, 
    UserForbiddenError, 
    UserNotAuthenticatedError 
} from "./errors";
import { respondWithJSON } from "./json";

type HandlerWithConfig = (config: ApiConfig, req: BunRequest) => Promise<Response>;

export function withConfig(config: ApiConfig, handler: HandlerWithConfig) {
    return (req: BunRequest) => handler(config, req)
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