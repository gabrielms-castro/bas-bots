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
            GET: withConfig(config, withAuth(handlerGetCredential)),
            POST: withConfig(config, withAuth(handlerCreateCredential)),
        },
        "/api/credentials/:credentialID": {
            GET: withConfig(config, withAuth(handlerGetCredentialByID)),
            DELETE: withConfig(config, withAuth(handlerDeleteCredential)),
            PATCH: withConfig(config, withAuth(handlerUpdateCredential)),
        },
    },
    error(err) {
        return errorHandlingMiddleware(config, err)
    }
});
console.log(`Server running at http://localhost:${config.port}`);
