# 🌉 Sesión 7 — Otras Blockchain y ecosistemas modernos

## Objetivo
Comprender las diferencias clave entre Ethereum y otros ecosistemas líderes (Solana, Avalanche, Algorand, TON, entre otros), evaluando pros y contras, características destacadas y casos de uso. Al final, tendrás una visión clara de cuándo elegir cada red y cómo mover activos e información entre cadenas con bridges y swaps cross‑chain.

---

## 1) Cómo comparar cadenas (marco de evaluación)
Para comparar Ethereum con otras redes, usa criterios repetibles:
- Consenso y seguridad: mecanismo (PoS, BFT, probabilístico), tolerancia a fallos, set de validadores.
- Finalidad (finality) y latencia: cuánto tarda una transacción en considerarse irreversible.
- Rendimiento/TPS y paralelismo: ejecución secuencial vs paralela; cuellos de botella de estado.
- Costos: tarifas promedio y su variabilidad bajo congestión.
- Modelo de ejecución/cuentas: EVM vs AVM/WASM/Move; modelo de cuentas/objetos; compatibilidad.
- Herramientas y DX: lenguajes, SDKs, wallets, exploradores, depuración, frameworks.
- Descentralización y alineación con estándares: número/calidad de validadores, estándares de tokens, interoperabilidad.
- Ecosistema y liquidez: TVL, DEX/bridges, NFT, pagos, integraciones Web2.

---

## 2) Resumen comparativo rápido (vs Ethereum)
- Ethereum: EVM, PoS con finality en minutos (con confirmaciones seguras), muy descentralizado, tarifas variables; capa base de confianza para rollups y L2.
- Solana: alto paralelismo (Sealevel), bloques rápidos, finality en segundos, tarifas muy bajas; no EVM; fuerte integración con wallets nativas.
- Avalanche: subnets y C‑Chain (EVM) con finality rápida; opción de appchains personalizadas; buena compatibilidad con herramientas de Ethereum.
- Algorand: PPoS con finality rápida, tarifas previsibles y muy bajas; AVM/TEAL (no EVM); primitives L1 como ASA y Atomic Transfers.
- TON: sharding dinámico nativo, finality y latencia muy bajas; integración con Telegram; no EVM (FunC/Tact); enfoque consumer/payments.

---

## 3) Solana — velocidad y paralelismo (Sealevel)
- Arquitectura y consenso
  - Proof of History (PoH) + Tower BFT sobre PoS. PoH ordena eventos, reduce latencia de consenso.
  - Runtime Sealevel: ejecución paralela de transacciones si no compiten por las mismas cuentas.
  - Modelo de cuentas: cada transacción declara de antemano qué cuentas lee/escribe, permitiendo scheduling paralelo determinístico.
- Rendimiento y costes
  - Bloques rápidos (sub‑segundo) y finalidad en ~2–5 s en condiciones normales.
  - Tarifas bajas y locales (local fee markets para hotspots). Congestión acotada a cuentas/calendarios específicos.
- Desarrollo
  - Lenguajes: Rust (principal) con framework Anchor; también existen opciones como Seahorse (Python) o Solang (Solidity a BPF, limitado).
  - SDKs: `@solana/web3.js`, CLI de Solana, Solana Program Library (SPL), Anchor.
  - Tokens SPL (fungibles y NFTs). Compresión de estado para NFTs de bajo costo.
- Pros vs Ethereum
  - Alto throughput real con paralelismo; UX de baja latencia/costo.
  - Buenas primitivas para apps de consumo, pagos y trading de alta frecuencia.
- Contras
  - No es EVM; curva de aprendizaje en Rust/Anchor y modelo de cuentas.
  - Requisitos de hardware y complejidad del runtime; historial de incidentes, aunque con mejoras continuas.
- Ejemplo práctico (devnet): crear wallet, airdrop y transferencia SOL
  ```ts
  import { Keypair, Connection, SystemProgram, LAMPORTS_PER_SOL, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  const kp = Keypair.generate();
  await conn.requestAirdrop(kp.publicKey, 1 * LAMPORTS_PER_SOL);

  const to = new PublicKey('DestinatarioPubKey...');
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: to, lamports: 0.01 * LAMPORTS_PER_SOL }));
  const sig = await sendAndConfirmTransaction(conn, tx, [kp]);
  console.log('Tx', sig);
  ```

---

## 4) Avalanche — subnets y compatibilidad EVM
- Arquitectura y consenso
  - Familia de consensos Snow: rapidez de convergencia mediante sondeos repetidos (metastabilidad).
  - Primary Network con tres cadenas: X‑Chain (DAG para activos), P‑Chain (staking y gestión de subnets) y C‑Chain (EVM lineal con Snowman).
  - Subnets: grupos de validadores ejecutan una VM específica (p.ej., Subnet‑EVM) con reglas propias (comisiones, listas, KYC, etc.).
- Rendimiento y costes
  - Finality rápida (≈1–2 s típicos) y tarifas competitivas en C‑Chain; posibilidad de configurar parámetros en subnets.
- Desarrollo
  - C‑Chain: EVM 100% compatible con Solidity, Hardhat/Foundry, MetaMask. Explorador: Snowtrace.
  - Subnet‑EVM: crear tu propia cadena EVM en minutos; también hay VMs no‑EVM.
- Pros vs Ethereum
  - Appchains nativos (subnets) con control total sobre economía/red sin renunciar al tooling EVM.
  - Finalidad rápida y buen rendimiento en C‑Chain.
- Contras
  - Fragmentación entre subnets; puentes adicionales para mover liquidez entre subnets y hacia otras cadenas.
  - Requisitos de validación/operación más complejos para quienes gestionan subnets.

---

## 5) Algorand — finality rápida y primitives L1
- Arquitectura y consenso
  - Pure Proof‑of‑Stake (PPoS) con sorteo criptográfico (VRF) para proponer y validar bloques; evita forks largos por diseño.
- AVM y contratos
  - Algorand Virtual Machine (AVM) ejecuta TEAL (ensamblador) y lenguajes de alto nivel como PyTeal; soporte para smart contracts stateful/stateless.
  - Primitive L1: Algorand Standard Assets (ASA), Atomic Transfers, Rekeying, escrow accounts.
- Rendimiento y costes
  - Finalidad en ~3–5 s; tarifas muy bajas y predecibles (por transacción estándar).
- Pros vs Ethereum
  - Primitives útiles directamente en L1; latencia y costos estables.
  - Modelo de seguridad simple, sin depender de L2 para UX aceptable.
- Contras
  - No EVM; menor ecosistema DeFi/NFT que Ethereum y sus L2.
  - Herramientas/lenguajes específicos (TEAL/PyTeal) con curva de aprendizaje distinta.

---

## 6) TON — sharding dinámico e integración con Telegram
- Arquitectura y consenso
  - Diseño multichain: masterchain coordina workchains, cada una con shardchains; sharding dinámico según carga.
  - Almacenamiento basado en celdas (Bag‑of‑Cells); mensajería asíncrona entre contratos.
- Desarrollo
  - Lenguajes: FunC y Tact; tooling y SDKs en crecimiento. Estándares de tokens: Jettons (fungibles) y NFTs.
  - TON Connect para conectar wallets en dApps (similar a EIP‑1193 en espíritu, distinto en detalles).
- Rendimiento y costes
  - Enfoque en baja latencia y costos mínimos; casos de uso de micropagos y mini‑apps.
- Pros vs Ethereum
  - Gran base de usuarios vía Telegram y UX integrada; throughput y latencia muy competitivos.
- Contras
  - No EVM; ecosistema más joven, documentación y tooling aún madurando.

---

## 7) Otras redes y familias (vistazo rápido)
- Polygon
  - Polygon PoS: sidechain compatible con EVM; tarifas bajas y alta adopción de dApps.
  - Polygon zkEVM/zk‑rollups: pruebas de validez heredando seguridad de Ethereum.
- BNB Smart Chain (BSC): EVM con tiempos de bloque rápidos y costos bajos; set de validadores más reducido.
- Cosmos SDK + IBC: framework de appchains soberanas con comunicación trust‑minimized vía IBC (ej.: Cosmos Hub, Osmosis). No EVM por defecto (salvo Ethermint/EVMos).
- NEAR: sharding Nightshade, WASM, foco en DX con contratos en Rust/AssemblyScript; finality rápida.
- Aptos/Sui: lenguaje Move, modelo orientado a objetos (especialmente en Sui), alto rendimiento; no EVM.

---

## 8) Bridges y swaps cross‑chain — conceptos esenciales
- ¿Por qué existen? Liquidez y usuarios están distribuidos en múltiples cadenas. Necesitamos mover valor y mensajes de forma segura.
- Modelos de puente
  - Lock‑and‑mint / burn‑and‑release: bloqueas en origen, emites un "wrapped" en destino (y viceversa al volver). Riesgo: set de validadores/custodios.
  - Liquidity networks (bridges con pools): proveedores de liquidez en ambas cadenas facilitan el traspaso inmediato; cobros por slippage/tarifas.
  - Light‑client / native (trust‑minimized): cada lado verifica pruebas del otro (ej.: IBC en Cosmos); más seguro, más complejo.
  - Mensajería generalizada: protocolos como Wormhole, Axelar o Chainlink CCIP entregan mensajes arbitrarios; encima puedes implementar "transferencias" o acciones cross‑chain.
  - Optimistic: asumen validez salvo disputa dentro de una ventana; menor coste a cambio de latencia de seguridad.
- Riesgos y buenas prácticas
  - Seguridad del puente vs L1: ataques a multisig/guardianes; errores en contratos; exploits históricos han sido significativos.
  - Wrapped assets: riesgo de depeg si el puente falla; evalúa la reputación del emisor/puente.
  - Rate limits y pausas: mecanismos de seguridad pueden frenar retiros.
  - Buenas prácticas: usa puentes canónicos del proyecto cuando existan, verifica direcciones/URLs, comienza con montos pequeños, monitorea tarifas/tiempos, prefiere agregadores reputados.
- Agregadores y herramientas
  - LI.FI, Rango, Socket: encuentran rutas óptimas combinando bridges + DEX; abstraen complejidad y comparan tarifas/tiempos.
  - Wormhole, Axelar, CCIP: capa de mensajería cross‑chain para tokens y llamadas contract‑to‑contract.
- Flujo típico de un swap cross‑chain (agregador)
  1) Seleccionar cadena origen/destino y token de entrada/salida.
  2) El agregador calcula ruta (aprobaciones ERC‑20 si aplica, bridge A → DEX → bridge B…).
  3) Firmas transacciones en origen; esperas confirmación y relays; reclamas en destino.
  4) Verificas recibo en ambos exploradores y congruencia de montos menos tarifas.

---

## 9) Práctica sugerida (paso a paso)
- Solana (devnet)
  1) Genera un `Keypair` y guarda la clave pública.
  2) Solicita `airdrop` de 1 SOL en devnet.
  3) Envía 0.01 SOL a otra cuenta y verifica en el Explorer (devnet).
- Avalanche C‑Chain (Fuji)
  1) Agrega Fuji a MetaMask; obtén AVAX de faucet.
  2) Envía AVAX a otra dirección o interactúa con un contrato EVM simple.
- Cross‑chain
  1) En testnet, usa un agregador (cuando soporte testnets) o un puente oficial para mover activos pequeños entre redes soportadas.

---

## Material complementario
- Faucet Solana - https://faucet.solana.com/
- Solana Docs — Arquitectura y guía para desarrolladores: https://docs.solana.com/
- @solana/web3.js — Referencia de API (Keypair, Connection, Transaction, `requestAirdrop`): https://solana-labs.github.io/solana-web3.js/
- Solana Cookbook — Crear una wallet (Keypair) en JS: https://www.solanacookbook.com/references/keypairs-and-wallets.html#how-to-generate-a-new-keypair
- Solana Cookbook — Enviar SOL y firmar transacciones: https://www.solanacookbook.com/references/transactions.html#how-to-send-sol
- Solana Explorer — Devnet (ver cuentas y transacciones): https://explorer.solana.com/?cluster=devnet
- Solana Faucet (Devnet): https://faucet.quicknode.com/solana/devnet
- Avalanche Docs — Subnets (visión general y diseño): https://docs.avax.network/build/subnets
- Avalanche Docs — C‑Chain (EVM) y contratos: https://docs.avax.network/build/avalanchego-apis/c-chain/
- Snowtrace — Explorador de Avalanche C‑Chain: https://snowtrace.io/
- Avalanche Faucet (Fuji): https://faucet.avax.network/
- Algorand Developer Portal — Documentación y guías: https://developer.algorand.org/
- Algorand JS SDK — Referencia y ejemplos: https://github.com/algorand/js-algorand-sdk
- AlgoExplorer — Explorador de Algorand TestNet: https://testnet.algoexplorer.io/
- Algorand Faucet — TestNet: https://faucet.algoexplorer.io/
- TON Docs — Desarrollo de dApps y contratos en TON: https://docs.ton.org/
- TON Connect — Conectar wallets en TON: https://docs.ton.org/develop/dapps/ton-connect/
- TonWeb — JS para TON: https://github.com/toncenter/tonweb
- TON Explorer (tonviewer): https://tonviewer.com/
- Ethereum.org — Bridges (conceptos, modelos y riesgos): https://ethereum.org/en/developers/docs/bridges/
- Wormhole — Bridging multichain: https://docs.wormhole.com/
- Chainlink CCIP — Cross‑chain: https://docs.chain.link/ccip
- Axelar — Interoperabilidad cross‑chain: https://docs.axelar.dev/
- LI.FI — Agregador de bridges/swaps: https://docs.li.fi/
- Jupiter — Agregador de swaps en Solana: https://docs.jup.ag/
- Polygon Docs: https://polygon.technology/developers
- Cosmos IBC Docs: https://ibc.cosmos.network/
- NEAR Docs: https://docs.near.org/
- Aptos Dev: https://aptos.dev/
- Sui Dev: https://docs.sui.io/

---

Navegación: [⬅️ Sesión 6](../sesion-06/README.md) · [Siguiente ➡️ Sesión 8](../sesion-08/README.md)
