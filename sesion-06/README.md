# 🌐 Sesión 6 — Web3: Conectando contratos con aplicaciones

## Objetivo
Comprender qué es Web3 y cómo se implementa técnicamente en una dApp moderna. Al finalizar, podrás conectar un frontend del navegador con contratos inteligentes para leer y escribir en la blockchain, manejar eventos y tratar errores comunes.

---

## 1) ¿Qué es Web3?
Web3 es el conjunto de protocolos, estándares y herramientas que permiten a las aplicaciones interactuar con blockchains públicas (como Ethereum) de forma descentralizada. A diferencia de Web2 (cliente-servidor con bases de datos privadas), en Web3:
- Los datos y la lógica crítica residen en contratos inteligentes on‑chain.
- La identidad del usuario es su cuenta (dirección) controlada por una wallet.
- Las operaciones se envían como transacciones firmadas y son verificables por cualquiera.
- La interfaz (frontend) sigue siendo Web, pero usa un proveedor blockchain (wallet o RPC) para leer/escribir en la red.

Conceptos relacionados:
- dApp: aplicación que interactúa con contratos inteligentes.
- Wallet: software que gestiona claves y firma transacciones (MetaMask, Rabby, Frame, etc.).
- EIP‑1193: estándar que define cómo un proveedor Ethereum se expone en el navegador (`window.ethereum`).
- JSON‑RPC: protocolo de bajo nivel para métodos como `eth_call`, `eth_sendRawTransaction` y `eth_getLogs`.

---

## 2) Componentes técnicos clave
- Cuentas, claves y direcciones
  - Cuenta Externamente Controlada (EOA): tiene clave privada, firma transacciones. Ej: dirección de MetaMask.
  - Cuenta de Contrato: código + almacenamiento, no tiene clave privada; ejecuta código al recibir transacciones o mensajes (`call`).

- Proveedores (Providers)
  - Fuente de datos de blockchain (nodo RPC o wallet). Ejemplos: `BrowserProvider` (Ethers) que envuelve `window.ethereum`, `JsonRpcProvider` (Infura, Alchemy, Ankr, tu nodo).

- Firmantes (Signers)
  - Entidad capaz de firmar transacciones. En el navegador, suele provenir de la wallet conectada (MetaMask) vía EIP‑1193.

- Contratos y ABI
  - ABI: describe las funciones y eventos de un contrato para poder codificar/decodificar llamadas.
  - Librerías (`ethers.js`, `web3.js`) usan el ABI para generar métodos de lectura y escritura.

- Red y chainId
  - Cada red (Mainnet, Sepolia, Polygon, etc.) tiene un `chainId`. El contrato y la UI deben coincidir en la misma red.

- Gas, tarifas y nonce
  - Cada transacción paga gas (limite y precio). El `nonce` evita replays y ordena transacciones del emisor.

- Logs y eventos
  - Los contratos emiten `events` que se indexan como `logs`; sirven para notificaciones y sincronización de estados en la UI.

---

## 3) Arquitectura típica de una dApp
1. Frontend (HTML/JS/Framework) en el navegador.
2. Wallet en el navegador expone `window.ethereum` (EIP‑1193).
3. Librería Web3 (Ethers/Web3.js) crea un `Provider` y un `Signer` a partir de la wallet.
4. La UI lee datos (gratuito) con `eth_call` y envía transacciones firmadas para escribir estado.
5. Opcional: backend/indexer para cachear, agregar datos y servir búsquedas rápidas; no firma por el usuario.

Flujo básico de usuario:
- Conectar wallet → seleccionar cuenta → seleccionar red → leer datos → enviar transacción → esperar confirmación → mostrar recibo/estado.

---

## 4) Flujo técnico en el navegador (EIP‑1193)
- Detección del proveedor: `if (window.ethereum) { ... }`.
- Solicitud de cuentas: `ethereum.request({ method: 'eth_requestAccounts' })`.
- Escuchar cambios: `accountsChanged`, `chainChanged`, `disconnect`.
- Lectura: vía `Provider` (`eth_call`) no requiere firma ni gas.
- Escritura: `Signer.sendTransaction`/`contract.function(...)` firma, paga gas y devuelve `txHash` → esperar `receipt`.

---

## 5) Implementación con Ethers.js v6 (recomendada)
```html
<!doctype html>
<html>
  <body>
    <button id="connect">Conectar Wallet</button>
    <button id="read">Leer balance</button>
    <button id="write">Incrementar contador</button>
    <pre id="out"></pre>
    <script type="module">
      import { BrowserProvider, Contract, formatEther } from 'https://cdn.jsdelivr.net/npm/ethers@6.12.1/dist/ethers.min.js';

      const out = (msg) => (document.getElementById('out').textContent += `\n${msg}`);

      const CONTRACT_ADDRESS = '0x...'; // reemplace por su contrato
      const ABI = [
        'function counter() view returns (uint256)',
        'function increment() public',
        'function balanceOf(address) view returns (uint256)',
        'event Incremented(address indexed by, uint256 newValue)'
      ];

      let provider, signer, contract;

      async function getProvider() {
        if (!window.ethereum) throw new Error('Wallet no encontrada. Instale MetaMask.');
        provider = new BrowserProvider(window.ethereum);
        return provider;
      }

      async function connect() {
        await getProvider();
        await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        out(`Conectado: ${await signer.getAddress()}`);
        contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
        // Escuchar eventos del contrato
        contract.on('Incremented', (by, newValue) => out(`Evento Incremented: by=${by}, newValue=${newValue}`));
      }

      async function readBalance() {
        await getProvider();
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const address = accounts[0];
        // Ejemplo: leer ETH nativo
        const balanceWei = await provider.getBalance(address);
        out(`Balance ETH: ${formatEther(balanceWei)} ETH`);
        // Ejemplo leer variable de contrato
        if (contract) {
          const c = await contract.counter();
          out(`Counter: ${c}`);
        }
      }

      async function writeTx() {
        if (!contract) throw new Error('Conecte primero la wallet.');
        const tx = await contract.increment(); // Ethers estima gas automáticamente
        out(`Enviada: ${tx.hash}`);
        const receipt = await tx.wait();
        out(`Confirmada en bloque ${receipt.blockNumber}`);
      }

      document.getElementById('connect').onclick = connect;
      document.getElementById('read').onclick = readBalance;
      document.getElementById('write').onclick = writeTx;
    </script>
  </body>
</html>
```

Notas:
- Use `BrowserProvider` para MetaMask en el navegador. Para un RPC sin wallet use `JsonRpcProvider`.
- Si la red no coincide, pida cambio con `wallet_switchEthereumChain` o agregue con `wallet_addEthereumChain`.

---

## 6) Implementación con Web3.js v4 (alternativa)
```html
<script type="module">
  import Web3 from 'https://cdn.jsdelivr.net/npm/web3@4.10.0/dist/web3.min.js';
  const web3 = new Web3(window.ethereum);
  const ABI = [ 'function counter() view returns (uint256)', 'function increment() public' ];
  const CONTRACT_ADDRESS = '0x...';
  const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

  async function connect() {
    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log('Cuenta', account);
  }

  async function read() {
    const c = await contract.methods.counter().call();
    console.log('Counter', c);
  }

  async function write() {
    const [from] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const tx = await contract.methods.increment().send({ from });
    console.log('Receipt', tx);
  }
</script>
```

Diferencias clave vs Ethers: API distinta, manejo de unidades y eventos con sintaxis propia, pero conceptos equivalentes (provider, accounts, call vs send).

---

## 7) Lectura vs Escritura: patrones
- Lectura (gratuito):
  - `Provider.getBalance`, `contract.function()` con `view/pure` → usa `eth_call` (no firma, no gas).
- Escritura (tiene costo):
  - `Signer.sendTransaction` o `contract.function()` sin `view` → firma, paga gas y retorna `txHash`.
  - Estimar gas (`estimateGas`) y esperar recibo (`tx.wait()` en Ethers).

---

## 8) Seguridad y UX básicas
- Solicite permisos mínimos, muestre red y dirección activas.
- Valide inputs antes de enviar transacciones; maneje `userRejectedRequest`.
- Evite exponer claves en frontend. Nunca firme en backend en nombre del usuario.
- Actualice UI con eventos y/o consultando `receipt` y releyendo estado.

---

## 9) Errores comunes y cómo resolver
- No existe `window.ethereum`: instale una wallet o use un provider RPC sólo lectura.
- Red incorrecta (`chainId`): use `wallet_switchEthereumChain` o guíe al usuario a cambiar.
- Nonce o gas: si falla por `nonce too low`/`replacement underpriced`, espere confirmaciones o incremente `maxFee`/`maxPriorityFee`.
- Rechazo del usuario: capture y muestre un mensaje claro, permita reintentar.
- ABI/dirección errónea: verifique contrato, red y que el ABI coincide con el binario desplegado.

---

## 10) Práctica guiada
- Crear una dApp básica con HTML/JS conectada a MetaMask.
- Mostrar la cuenta conectada y la red actual.
- Leer el balance de ETH y de un token ERC‑20 (`balanceOf`).
- Ejecutar una función de escritura en un contrato (por ejemplo `increment`).
- Escuchar un evento y reflejarlo en pantalla.

---

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
