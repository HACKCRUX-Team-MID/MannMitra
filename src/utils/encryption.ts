/**
 * encryption.ts — AES-256-GCM encryption using the browser's Web Crypto API
 *
 * No external libraries. Matches Flutter's encryption_service.dart:
 *  - AES-256-GCM (authenticated encryption)
 *  - Key derived from passphrase using PBKDF2 (SHA-256, 100,000 iterations)
 *  - IV (12 bytes) prepended to ciphertext, salt (16 bytes) appended
 *  - Output format: Base64(iv[12] + ciphertext + salt[16])
 */

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12;   // bytes (GCM standard)
const SALT_LENGTH = 16; // bytes

function buf2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64toBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * @returns Base64 string: iv(12) + ciphertext + salt(16)
 */
export async function encryptText(plaintext: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv   = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key  = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  // Pack: iv + ciphertext + salt
  const payload = new Uint8Array(IV_LENGTH + ciphertext.byteLength + SALT_LENGTH);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), IV_LENGTH);
  payload.set(salt, IV_LENGTH + ciphertext.byteLength);

  return buf2b64(payload.buffer);
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * @param b64 Base64 string from encryptText
 */
export async function decryptText(b64: string, passphrase: string): Promise<string> {
  const payload = new Uint8Array(b64toBuf(b64));
  const totalLen = payload.length;

  const iv         = payload.slice(0, IV_LENGTH);
  const salt       = payload.slice(totalLen - SALT_LENGTH);
  const ciphertext = payload.slice(IV_LENGTH, totalLen - SALT_LENGTH);

  const key = await deriveKey(passphrase, salt);

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plainBuf);
}

/**
 * Quick check: Web Crypto available in this browser?
 * (True in all modern browsers and localhost. False only in very old browsers.)
 */
export function isEncryptionAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}
