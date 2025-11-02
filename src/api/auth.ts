import type { BunRequest } from "bun";
import type { ApiConfig } from "../config";
import { BadRequestError } from "./errors";
import { getUserByEmail } from "../db/users";

export async function handlerLogin(config: ApiConfig, req: BunRequest) {
    const { email, password } = await req.json();
    if (!email || !password) {
        throw new BadRequestError("É necessário fornecer um e-mail e uma senha")
    }
    const user = await getUserByEmail(config.db, email)
    if (!user) throw new 
}