import { handlerLogin } from "./api/auth";
import { errorHandlingMiddleware, withConfig } from "./api/middleware";
import { config } from "./config";
import { handlerCreateUser } from "./api/users";

import spa from "./app/index.html"
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
        }
    },
    error(err) {
        return errorHandlingMiddleware(config, err)
    }
});
console.log(`Server running at http://localhost:${config.port}`);