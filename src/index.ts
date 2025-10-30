import { handlerLogin } from "./api/auth";
import { withConfig } from "./api/middleware";
import { config } from "./config";
import spa from "./app/index.html"

Bun.serve({
    port: Number(config.port),
    development: config.platform === 'dev',
    routes: {
        "/": spa,
        // "/api/login": {
        //     POST: withConfig(config, handlerLogin),
        // }
    },
});
console.log(`Server running at http://localhost:${config.port}`);