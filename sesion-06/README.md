# 🌐 Sesión 6 — Web3: Conectando contratos con aplicaciones

## Objetivo
Integrar blockchain con aplicaciones web (dApps).

## Subtemas
- Introducción a Web3.js y Ethers.js.
- Conexión de MetaMask al navegador.
- Lectura y escritura de datos desde frontend.
- Eventos y notificaciones on-chain.

## Práctica
- Crear una dApp básica con HTML/JS conectada a MetaMask.
- Leer el balance de un token desde la interfaz.
- Ejecutar funciones del contrato desde el frontend.

Material complementario:

- ethers.js v6 — Documentación principal (providers, signers, contratos): https://docs.ethers.org/v6/
- ethers.js v6 — Providers (BrowserProvider/JsonRpcProvider) y Signers: https://docs.ethers.org/v6/api/providers/
- ethers.js v6 — Contratos: llamadas de lectura/escritura y eventos (`Contract.on`): https://docs.ethers.org/v6/api/contract/
- web3.js — Documentación v4 (Web3.js para dApps en el navegador): https://docs.web3js.org/
- web3.js — Contratos (`Web3.eth.Contract`) y llamadas read/write: https://docs.web3js.org/guides/web3_contracts/
- web3.js — Eventos y suscripciones (`logs`, filtros y websockets): https://docs.web3js.org/guides/events_subscriptions/
- MetaMask — Proveedor EIP‑1193 (`window.ethereum`) y API del navegador: https://docs.metamask.io/wallet/reference/ethereum-provider/
- EIP‑1193 — Ethereum Provider JavaScript API (estándar de conexión de wallets): https://eips.ethereum.org/EIPS/eip-1193
- MetaMask — Solicitar cuentas con `eth_requestAccounts`: https://docs.metamask.io/wallet/reference/eth_requestAccounts/
- MetaMask — Agregar redes con `wallet_addEthereumChain` (EIP‑3085): https://docs.metamask.io/wallet/reference/wallet_addethereumchain/
- MetaMask — Cambiar de red con `wallet_switchEthereumChain` (EIP‑3326): https://docs.metamask.io/wallet/reference/wallet_switchethereumchain/
- Ethereum Docs — JSON‑RPC (métodos `eth_call`, `eth_sendTransaction`, `eth_getLogs`): https://ethereum.org/en/developers/docs/apis/json-rpc/
- ethers.js v6 — Filtros y logs (`getLogs`, filtros por tema) en Providers: https://docs.ethers.org/v6/api/providers/
- Alchemy Blog — Tutorial: tu primera dApp Web3 con HTML/JS + MetaMask + Ethers: https://www.alchemy.com/blog/how-to-make-your-first-web3-dapp

---

Navegación: [⬅️ Sesión 5](../sesion-05/README.md) · [Siguiente ➡️ Sesión 7](../sesion-07/README.md)
