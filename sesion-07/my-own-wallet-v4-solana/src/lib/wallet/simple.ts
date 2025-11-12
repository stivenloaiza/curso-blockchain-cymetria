// Lógica para cuenta simple de Solana (sin HD)
// ----------------------------------------------
// Este módulo encapsula la generación e importación de cuentas simples en Solana
// (par de claves ed25519) usando @solana/web3.js. Mantiene una API similar a la de
// Ethereum para reutilizar la UI existente del curso.
//
// Conceptos clave:
// - En Solana, las direcciones son la clave pública (PublicKey) codificada en base58.
// - La clave "privada" que solemos exportar en demos es el secretKey (64 bytes)
//   que contiene seed (32) + publicKey (32), codificado en base58.
// - NUNCA compartas tu clave secreta real. Esto es sólo educativo.

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export type SimpleAccount = {
  address: string; // PublicKey en base58
  privateKey: string; // SecretKey en base58 (64 bytes)
};

// Genera una cuenta aleatoria nueva (Keypair)
export function createSimpleWallet(): SimpleAccount {
  const kp = Keypair.generate();
  return {
    address: kp.publicKey.toBase58(),
    privateKey: bs58.encode(kp.secretKey),
  };
}

// Dada una secretKey en base58 (64 bytes), devuelve la PublicKey en base58
// Mantiene el nombre para compatibilidad con la UI existente.
export function addressFromPrivateKey(secretKeyBase58: string): string {
  const bytes = bs58.decode(secretKeyBase58.trim());
  if (bytes.length !== 64) {
    throw new Error("La clave secreta debe tener 64 bytes codificados en base58.");
  }
  const kp = Keypair.fromSecretKey(Uint8Array.from(bytes));
  return kp.publicKey.toBase58();
}

// Validación básica: true si la secretKey base58 permite reconstruir el Keypair
export function isValidPrivateKey(secretKeyBase58: string): boolean {
  try {
    addressFromPrivateKey(secretKeyBase58);
    return true;
  } catch {
    return false;
  }
}
