import crypto from "node:crypto";
import { machineIdSync } from "node-machine-id";

const STATIC_SALT = "babel";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Generate a device-specific cryptographic key using the machine ID and a static salt.
 * @returns A 32-byte cryptographic key.
 */
function getDeviceKey(): Buffer {
  const machineId = machineIdSync(); // Get the machine ID
  const rawKey = `${machineId}:${STATIC_SALT}`; // Combine with static salt
  return crypto.createHash("sha256").update(rawKey).digest(); // Generate a 32-byte key
}

/**
 * Encrypt a string (e.g., API key) using AES encryption and a device-specific key.
 * @param text The raw API key to encrypt.
 * @returns The encrypted API key as a Base64 string.
 */
export function encrypt(text: string): string {
  const key = getDeviceKey();
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random initialization vector
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Combine the IV and the encrypted data
  return `${iv.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt an encrypted API key using AES decryption and a device-specific key.
 * @param encryptedText The encrypted API key as a Base64 string.
 * @returns The raw API key.
 */
export function decrypt(encryptedText: string): string {
  const key = getDeviceKey();

  // Split the IV and encrypted data
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format. Expected 'iv:ciphertext'.");
  }

  const [ivBase64, encryptedBase64] = parts;

  const iv = Buffer.from(ivBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
