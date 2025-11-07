# 🔐 Sesión 2 — Criptografía aplicada a Blockchain

## Objetivo
Entender y practicar cómo se protegen las transacciones mediante criptografía.

## Subtemas
- Criptografía asimétrica (claves públicas y privadas).
- Firmas digitales y generación de direcciones.
- Hashing: SHA-256, Keccak-256, Merkle Trees.
- Wallets: hot vs cold, seed phrase, seguridad.

## Práctica
- Generar pares de claves y direcciones con herramientas en Javascript.
- Analizar una wallet (MetaMask).
- Replicar base de MetaMask en Javascript

### Proyecto NextJS (TypeScript): my-own-wallet
A continuación crearemos un proyecto Next.js desde cero para la práctica del front-end de la wallet.

1) Crear el proyecto (interactivo), antes de esto verifica que tienes NodeJS instalado:
```bash
npx create-next-app@latest
```
- Nombre del proyecto: my-own-wallet
- TypeScript: Yes
- ESLint: Yes (recomendado)
- App Router: Yes
- Import alias: Yes (opcional)

Alternativa no interactiva (recomendada):
```bash
npx create-next-app@latest my-own-wallet --ts
```
- Para mas detalles de NextJS visita https://nextjs.org/ en tu navegador.

2) Ubicación sugerida en este repositorio:
- Crear el proyecto dentro de la carpeta de esta sesión: `sesion-02/my-own-wallet`

3) Instala librerías y ejecutar el proyecto en desarrollo:
```bash
cd sesion-02/my-own-wallet
npm install
npm run dev
```
- Abre http://localhost:3000 en tu navegador.

4) Siguientes pasos:
- Integra los componentes de la wallet y las vistas a partir de los prompts de IA de abajo.

#### Prompts para la IA (UI/UX)
1. Requiero que en el proyecto my-own-wallet hecho en NextJS (/sesion-02/my-own-wallet/) hagas:
Crees una vista bonita para el inicio de una crypto wallet simple de Ethereum llamada My Own Wallet, con un botón de crear cuenta simple Eth y otro de crear HD Wallet ETH, sigue una estética crypto amigable y muy buen ui/ux con las ultimas tendencias.

2. Crea una vista para que cuando le den al botón de crear cuenta simple muestre un espacio para la address y la clave privada, manteniendo la estética de la vista de inicio.

3. Crea una vista para que cuando le den al botón de crear cuenta HD muestre un espacio para ver la frase semilla, las address y la clave privada de cada address, ademas de un botón para agregar mas cuentas a partir de esa HD, manteniendo la estética de la vista de inicio.

Material complementario:

- SECG — SEC 1 v2: Elliptic Curve Cryptography (base de ECDSA/secp256k1): https://secg.org/sec1-v2.pdf
- NIST FIPS 180-4 — Secure Hash Standard (SHA-256): https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
- Keccak Team — Keccak (SHA-3/Keccak-256) overview y referencias: https://keccak.team/keccak.html
- Ethereum Docs — Cuentas y direcciones: https://ethereum.org/en/developers/docs/accounts/
- EIP-55 — Mixed-case checksum address encoding para Ethereum: https://eips.ethereum.org/EIPS/eip-55
- Mastering Bitcoin (O’Reilly, libro abierto) — Cap. 4 Claves, direcciones y wallets: https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch04.asciidoc
- BIP-32 — Hierarchical Deterministic Wallets (HD): https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
- BIP-39 — Mnemonic code for generating deterministic keys (seed phrase): https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- RFC 6962 — Merkle Hash Trees (definición formal): https://www.rfc-editor.org/rfc/rfc6962
- web3.js — Cuentas, firmas y manejo de claves (Web3-eth-accounts): https://web3js.readthedocs.io/en/v1.10.0/web3-eth-accounts.html
- ethers.js — Wallets, firmas y claves: https://docs.ethers.org/v6/api/wallet/
- MetaMask Docs — Conceptos, seguridad y arquitectura general: https://docs.metamask.io/
- MetaMask Soporte — Secret Recovery Phrase (seed phrase) y buenas prácticas: https://support.metamask.io/hc/en-us/articles/360015488891-What-is-a-Secret-Recovery-Phrase-SRP
- OpenZeppelin — Utilidades criptográficas en contratos (ECDSA, MerkleProof): https://docs.openzeppelin.com/contracts/4.x/utilities#cryptography

---

Navegación: [⬅️ Sesión 1](../sesion-01/README.md) · [Siguiente ➡️ Sesión 3](../sesion-03/README.md)
