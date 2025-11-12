// Lógica para cuenta simple de Ethereum (sin HD)
// -------------------------------------------------
// Este módulo encapsula la generación y validación de cuentas "simples"
// (una sola clave privada) utilizando ethers.js v6. Está separado de la vista
// para mantener una clara separación de responsabilidades (UI vs lógica) y
// facilitar su explicación en un curso.
//
// Conceptos clave:
// - La cuenta simple se define por una clave privada en la curva elíptica
//   secp256k1. A partir de esa clave se obtiene la clave pública, y su hash
//   (Keccak-256) determina la dirección Ethereum (últimos 20 bytes, con checksum EIP-55).
// - NUNCA compartas tu clave privada real. Este código es solo educativo.

import { Wallet } from "ethers";

export type SimpleAccount = {
  address: string; // Dirección Ethereum en formato checksum (EIP-55)
  privateKey: string; // Clave privada en hex con prefijo 0x
};

// Genera una cuenta aleatoria nueva (clave privada + address)
// Nota: Wallet.createRandom() usa un RNG seguro bajo el capó.
export function createSimpleWallet(): SimpleAccount {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

// Dada una clave privada (hex), calcula su dirección Ethereum checksum
// Lanza un error si la clave es inválida.
export function addressFromPrivateKey(privateKey: string): string {
  // Normalizamos: si viene sin 0x, ethers lo soporta si el tamaño es válido,
  // pero es mejor estandarizar con el prefijo.
  const normalized = privateKey.trim().startsWith("0x")
    ? privateKey.trim()
    : ("0x" + privateKey.trim());

  // Si la clave no es válida, el constructor Wallet lanzará un error.
  const wallet = new Wallet(normalized);
  return wallet.address; // ethers devuelve en formato checksum (EIP-55)
}

// Validación básica (opcional): retorna true si la clave privada es válida.
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    addressFromPrivateKey(privateKey);
    return true;
  } catch {
    return false;
  }
}
