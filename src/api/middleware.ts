import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";

type HandlerWithConfig = (config: ApiConfig, req: BunRequest) => Promise<Response>;

export function withConfig(config: ApiConfig, handler: HandlerWithConfig) {
    return (req: BunRequest) => handler(config, req)
}