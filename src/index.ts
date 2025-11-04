import { handlerLogin, handlerRefreshToken, handlerRevoke } from "./api/auth";
import { errorHandlingMiddleware, withConfig } from "./api/middleware";
import { config } from "./config";
import { handlerCreateUser } from "./api/users";

import spa from "./app/index.html"
import { handlerReset } from "./api/reset";
import { handlerCreateCredential, handlerDeleteCredential, handlerGetCredential, handlerGetCredentialByID, handlerUpdateCredential } from "./api/credentials";
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
            GET: withConfig(config, handlerGetCredential),
            POST: withConfig(config, handlerCreateCredential),
        },
        "/api/credentials/:credentialID": {
            GET: withConfig(config, handlerGetCredentialByID),
            DELETE: withConfig(config, handlerDeleteCredential),
            PATCH: withConfig(config, handlerUpdateCredential),
        },
    },
    error(err) {
        return errorHandlingMiddleware(config, err)
    }
});
console.log(`Server running at http://localhost:${config.port}`);