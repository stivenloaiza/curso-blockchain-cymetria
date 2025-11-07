// Lógica para HD Wallet (BIP-39 + BIP-44) en Ethereum
// -----------------------------------------------------
// Este módulo concentra funciones para trabajar con frases semilla (mnemonics)
// y derivación determinística de múltiples cuentas (Hierarchical Deterministic).
//
// Conceptos clave resumidos:
// - BIP-39 define cómo crear una frase mnemónica (12/24 palabras) que se convierte
//   en una semilla binaria.
// - BIP-44 define la estructura de rutas de derivación para múltiples monedas y
//   cuentas. Para Ethereum se usa la ruta: m/44'/60'/account'/change/index
//   donde 60 es el coin_type de Ethereum.
// - Cada índice genera una nueva clave privada y dirección, pero todo es
//   reproducible a partir de la misma frase semilla (determinístico).
//
// ADVERTENCIA: Este código es educativo. No utilices la misma seed en producción.

import { HDNodeWallet, Wallet, wordlists } from "ethers";

export type HDAccount = {
  index: number;          // Índice i en la ruta m/44'/60'/0'/0/i
  path: string;           // Ruta completa usada para derivar (BIP-44)
  address: string;        // Dirección Ethereum (checksum EIP-55)
  privateKey: string;     // Clave privada derivada en hex (0x...)
};

// Conjunto de conteos de palabras válidos según BIP-39 (modos comunes)
const VALID_WORD_COUNTS = new Set([12, 15, 18, 21, 24]);

// Normaliza la mnemónica a una forma canónica:
// - NFKD para separar diacríticos (estándar BIP-39)
// - minúsculas
// - colapsar espacios (tabs, saltos de línea) a un solo espacio
// - trim de extremos
function canonicalizarMnemonic(phrase: string): string {
  return phrase
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/gu, " ");
}

// Valida que la mnemónica tenga un conteo de palabras soportado.
function assertValidWordCount(phrase: string) {
  const words = phrase.split(" ").filter(Boolean);
  if (!VALID_WORD_COUNTS.has(words.length)) {
    throw new Error(
      `La frase mnemónica debe tener 12, 15, 18, 21 o 24 palabras. Se detectaron ${words.length}.`
    );
  }
}

// Verifica que todas las palabras existan en el diccionario BIP-39 en inglés
function assertWordsInWordlist(phrase: string) {
  const wl = wordlists.en;
  const words = phrase.split(" ").filter(Boolean);
  for (const w of words) {
    if (wl.getWordIndex(w) < 0) {
      throw new Error(
        `La palabra "${w}" no pertenece al wordlist en inglés (BIP-39).`
      );
    }
  }
}

// Genera y retorna una frase mnemónica BIP-39 (12 palabras por defecto en ethers)
export function createMnemonic(): string {
  const w = Wallet.createRandom(); // En ethers v6 esto devuelve un HDNodeWallet con mnemónica EN
  const phrase = w.mnemonic?.phrase;
  if (!phrase) {
    throw new Error("No fue posible generar una frase mnemónica");
  }
  // Devolvemos la versión canónica para evitar problemas de espacios/Unicode
  return canonicalizarMnemonic(phrase);
}

// Deriva una sola cuenta HD a partir de una frase y un índice, usando la ruta BIP-44
// Ruta por defecto: m/44'/60'/{account}'/{change}/{index}
export function deriveAccount(phrase: string, index: number, account = 0, change = 0): HDAccount {
  // En ethers v6, HDNodeWallet.fromPhrase(phrase) por defecto devuelve un nodo ya ubicado en
  // m/44'/60'/0'/0/0 (profundidad 5). Si intentamos derivar una ruta ABSOLUTA que empiece por
  // "m/" desde un nodo que no está en la raíz, ethers lanza el error:
  //   "cannot derive root path (i.e. path starting with \"m/\") for a node at non-zero depth"
  // Para evitarlo, pedimos explícitamente el nodo raíz (ruta "m") y desde allí derivamos toda la ruta BIP-44.
  const canonical = canonicalizarMnemonic(phrase);

  if (!canonical) {
    throw new Error("La frase mnemónica no puede estar vacía");
  }
  // Validación didáctica previa (longitud típica de BIP-39)
  assertValidWordCount(canonical);
  // Validamos adicionalmente que todas las palabras existan en el diccionario EN
  assertWordsInWordlist(canonical);
  // Fijamos wordlist a inglés (objeto) para evitar autodetección ambigua
  // y solicitamos el nodo raíz ("m") para derivar rutas absolutas completas.
  const root = HDNodeWallet.fromPhrase(canonical, undefined, "m", wordlists.en); // profundidad 0 (root, usando wordlists.en)
  const path = `m/44'/60'/${account}'/${change}/${index}`;
  const node = root.derivePath(path); // node es un HDNodeWallet con address y privateKey
  return {
    index,
    path,
    address: node.address,
    privateKey: node.privateKey,
  };
}

// Deriva múltiples cuentas consecutivas desde index=0 hasta count-1
export function deriveMany(phrase: string, count: number, account = 0, change = 0): HDAccount[] {
  const res: HDAccount[] = [];
  for (let i = 0; i < count; i++) {
    res.push(deriveAccount(phrase, i, account, change));
  }
  return res;
}
