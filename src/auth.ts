export async function hashPassword(password: string) {
    return await Bun.password.hash(password, {
        algorithm: "argon2id"
    })
}

export async function checkPasswordHash(password: string, hash: string) {
    if (!password) return false;
    try {
        return await Bun.password.verify(password, hash)
    } catch {
        return false
    }
}

