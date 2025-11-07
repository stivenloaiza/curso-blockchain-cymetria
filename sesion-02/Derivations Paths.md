# 🌐 Blockchain Path Derivations (BIP32 / BIP39 / BIP44)

Las **billeteras HD (Hierarchical Deterministic)** permiten generar miles de direcciones de criptomonedas a partir de una sola **semilla (seed)**.  
Esa seed sigue rutas llamadas **derivation paths**, que son estándares definidos por distintos **BIP (Bitcoin Improvement Proposals)**.

---

## Concepto básico

Una **ruta de derivación** define cómo obtener claves privadas y direcciones desde una semilla.

Ejemplo de ruta:
m / 44' / 60' / 0' / 0 / 0

- `m` → clave maestra
- `'` → derivación "hardened" (más segura)
- Cada nivel genera nuevas claves sin guardar las anteriores.

---

## 📘 BIPs principales

| BIP | Qué define | Ejemplo |
|-----|-------------|----------|
| **BIP32** | Derivación jerárquica de claves (HD wallets) | `m/0/1/2` |
| **BIP39** | Convierte una frase de 12-24 palabras en una semilla | `"abandon amount liar..."` |
| **BIP44** | Estructura estándar multi-moneda | `m/44'/60'/0'/0/0` |
| **SLIP-44** | Código numérico de cada blockchain | BTC=0, ETH=60, SOL=501 |

---

## 🧱 Estructura BIP44

m / purpose' / coin_type' / account' / change / address_index


Ejemplos:
| Blockchain | Path | Dirección típica |
|-------------|------|------------------|
| Bitcoin | `m/44'/0'/0'/0/0` | 1AbCdEf... |
| Ethereum | `m/44'/60'/0'/0/0` | 0x27Ef5c... |
| Solana | `m/44'/501'/0'/0/0` | 3D5vKX... |

---

## 🪄 Cómo funciona todo junto

1. **BIP39** → Genera una frase mnemónica (ej: 12 palabras).
2. Esa frase produce una **seed** (512 bits).
3. **BIP32** → Usa la seed para generar una clave maestra y subclaves.
4. **BIP44** → Define rutas específicas para cada blockchain.

👉 Con una sola frase puedes tener direcciones BTC, ETH, SOL, etc.

---

## ⚙️ Ejemplo en TypeScript

```ts
import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

// 1. Generar frase mnemónica
const mnemonic = bip39.generateMnemonic()

// 2. Crear semilla desde la frase
const seed = await bip39.mnemonicToSeed(mnemonic)

// 3. Nodo raíz BIP32
const root = bip32.fromSeed(seed)

// 4. Derivar una dirección Ethereum (BIP44)
const path = "m/44'/60'/0'/0/0"
const child = root.derivePath(path)

console.log('Mnemonic:', mnemonic)
console.log('Private Key:', child.privateKey.toString('hex'))


🔐 En resumen

BIP32 → Cómo derivar claves.

BIP39 → Cómo crear la seed (frase mnemónica).

BIP44 → Cómo organizar rutas para múltiples monedas.

SLIP-44 → Asigna números a cada blockchain.

Todo parte de una sola frase de 12-24 palabras.


Seed → Master Key (BIP32)
      → Path (BIP44)
         → Coin (ETH 60)
            → Account (0)
               → Change (0)
                  → Address (0)
