import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { config } from "./config";

export function encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(
        config.encryptionAlgorithm, 
        Buffer.from(config.encryptionKey, "hex"),
        iv
    );

    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const authTag = (cipher as any).getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted text format. Expected iv:tag:cipher");
    }
    
    const [ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex as string, "hex");
    const authTag = Buffer.from(tagHex as string, "hex");
    const cipherBuf = Buffer.from(cipherHex as string, "hex");
    const key = Buffer.from(config.encryptionKey, "hex");

    const decipher = createDecipheriv(config.encryptionAlgorithm, key, iv);
    (decipher as any).setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
    return decrypted.toString("utf8");
}