// Lógica para HD Wallet (BIP-39 + BIP-44) en Solana
// ---------------------------------------------------
// Este módulo trabaja con frases semilla (mnemonic) y derivación determinística
// de múltiples cuentas para Solana utilizando ed25519 y la ruta estándar:
//   m/44'/501'/{account}'/{change}/{index}
// Donde 501 es el coin_type asignado a Solana.
//
// ADVERTENCIA: Código educativo. No reutilices seeds de prueba en producción.

import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import bs58 from "bs58";

export type HDAccount = {
  index: number;          // Índice i en la ruta m/44'/501'/account'/change/index
  path: string;           // Ruta completa usada para derivar (BIP-44)
  address: string;        // PublicKey en base58 (Solana)
  privateKey: string;     // SecretKey (64 bytes) en base58
};

// Conjunto de conteos de palabras válidos según BIP-39 (modos comunes)
const VALID_WORD_COUNTS = new Set([12, 15, 18, 21, 24]);

function canonicalizarMnemonic(phrase: string): string {
  return phrase
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/gu, " ");
}

function assertValidWordCount(phrase: string) {
  const words = phrase.split(" ").filter(Boolean);
  if (!VALID_WORD_COUNTS.has(words.length)) {
    throw new Error(
      `La frase mnemónica debe tener 12, 15, 18, 21 o 24 palabras. Se detectaron ${words.length}.`
    );
  }
}

// Genera y retorna una mnemónica BIP-39 (12 palabras por defecto)
export function createMnemonic(): string {
  const phrase = bip39.generateMnemonic(128); // 128 bits de entropía → 12 palabras
  return canonicalizarMnemonic(phrase);
}

// Deriva una cuenta de Solana a partir de la mnemónica y un índice, usando BIP-44 ed25519
// Ruta: m/44'/501'/{account}'/{change}/{index}
export function deriveAccount(phrase: string, index: number, account = 0, change = 0): HDAccount {
  const canonical = canonicalizarMnemonic(phrase);
  if (!canonical) throw new Error("La frase mnemónica no puede estar vacía");
  assertValidWordCount(canonical);

  // BIP-39 → seed (512 bits). Usamos síncrono para simplicidad en UI.
  const seed = bip39.mnemonicToSeedSync(canonical);

  const path = `m/44'/501'/${account}'/${change}/${index}`;
  // Derivación ed25519 (ed25519-hd-key)
  const { key } = derivePath(path, seed.toString("hex")); // key: Buffer de 32 bytes

  // En Solana, a partir de una seed de 32 bytes construimos el Keypair
  const kp = Keypair.fromSeed(key);

  return {
    index,
    path,
    address: kp.publicKey.toBase58(),
    privateKey: bs58.encode(kp.secretKey),
  };
}

export function deriveMany(phrase: string, count: number, account = 0, change = 0): HDAccount[] {
  const res: HDAccount[] = [];
  for (let i = 0; i < count; i++) {
    res.push(deriveAccount(phrase, i, account, change));
  }
  return res;
}
