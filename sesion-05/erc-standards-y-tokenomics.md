# Estándares ERC y Tokenomics — Historia, usos y decisiones prácticas

Esta guía explica qué es un estándar ERC, cómo nacen a partir del proceso EIP, cuáles son los principales estándares de tokens en Ethereum (ERC‑20, ERC‑721, ERC‑1155, etc.), en qué casos se usan y un resumen práctico de tokenomics para diseñar un activo con propósito y sostenibilidad.

---

## 1) ¿Qué es un ERC? (y el proceso EIP)
- EIP (Ethereum Improvement Proposal): documento técnico que propone un cambio o estándar. Tiene categorías (Core, Networking, Interface, ERC — Standards Track) y estados (Draft → Review → Last Call → Final, o Abandoned/Rejected).
- ERC (Ethereum Request for Comments): sub‑categoría de EIP para estándares de aplicaciones, como interfaces de tokens. Define funciones/eventos mínimos para asegurar interoperabilidad entre wallets, exchanges y dApps.
- Beneficios de los estándares:
  - Interoperabilidad: cualquier wallet/DEX/bridge entiende el token.
  - Composabilidad: contratos pueden integrar tu token sin código ad‑hoc.
  - Seguridad y auditoría: superficies conocidas, tooling maduro.

Cronología breve (selección):
- 2015–2017: EIP‑20 (ERC‑20) — tokens fungibles.
- 2018: EIP‑721 (ERC‑721) — tokens no fungibles (NFT).
- 2019: EIP‑1155 — multi‑token (fungibles y no fungibles, batch).
- 2019: EIP‑165 — detección de interfaces (`supportsInterface`).
- 2020: EIP‑2612 — `permit` (aprobaciones por firma para ERC‑20, gasless UX).
- 2021: EIP‑2981 — regalías para NFT (señalización de royalties).
- 2022: EIP‑4626 — tokenized vaults (estandariza depósitos/retiros y shares).

---

## 2) ERC‑20 — Tokens fungibles
- Caso de uso: monedas, utilidades internas, puntos, governance (si no necesitas NFT), stablecoins, etc.
- Interfaz mínima: `totalSupply()`, `balanceOf(address)`, `transfer(address,uint256)`, `allowance(owner,spender)`, `approve(spender,uint256)`, `transferFrom(owner,to,uint256)`; eventos `Transfer`, `Approval`.
- Propiedades:
  - Fungible: cada unidad es indistinguible.
  - Decimales: típicamente 18, pero configurable.
- Extensiones comunes (OpenZeppelin): `Mintable`, `Burnable`, `Pausable`, `Permit` (EIP‑2612), `Snapshot`, `Votes` (para gobernanza con `ERC20Votes`).
- Cuándo elegir ERC‑20: cuando todas las unidades son iguales y necesitas allowances para terceros.

---

## 3) ERC‑721 — Tokens no fungibles (NFT)
- Caso de uso: arte digital, coleccionables, identidad/credenciales, entradas, objetos únicos en juegos.
- Interfaz: `ownerOf`, `balanceOf`, `transferFrom`/`safeTransferFrom`, `approve`, `getApproved`, `setApprovalForAll`; eventos `Transfer`, `Approval`, `ApprovalForAll`.
- Extensión `Metadata`: `name`, `symbol`, `tokenURI` (JSON con metadatos).
- Seguridad UX: usar `safeTransferFrom` para evitar que NFTs queden bloqueados en contratos no receptores.
- Cuándo elegir ERC‑721: cuando cada token representa algo único o indivisible.

---

## 4) ERC‑1155 — Multi Token Standard
- Caso de uso: juegos/economías con muchos ítems; combina fungibles (p. ej., oro #1) y no fungibles (espada #2) bajo un mismo contrato.
- Ventajas: transferencias en batch (`safeBatchTransferFrom`), una sola aprobación para muchos IDs, ahorro de gas y despliegues.
- URI: plantilla con `{id}` sustituible para metadatos por tipo.
- Cuándo elegir ERC‑1155: cuando manejas múltiples tipos de activos y necesitas eficiencia en batch.

---

## 5) Estándares y EIPs relacionados que deberías conocer
- EIP‑165 (detector de interfaces): `supportsInterface(bytes4)` permite a otros contratos verificar compatibilidad (usado por ERC‑721/1155).
- EIP‑2612 (`permit` para ERC‑20): aprobaciones vía firma EIP‑712 sin transacción on‑chain del dueño → UX sin gas para allowances.
- EIP‑2981 (regalías NFT): interfaz para reportar royalties; importante: las regalías no son forzadas por EVM, dependen de marketplaces.
- EIP‑4626 (Tokenized Vaults): estandariza depósitos/retiros de activos y emisión de shares; muy útil en DeFi para bóvedas/estrategias.
- Otros (según caso): ERC‑777 (hooks para tokens, avanzado), ERC‑1363 (transfer & call), ERC‑6909 (multi‑token minimalista, experimental).

---

## 6) ¿Cuál uso para mi proyecto? (guía rápida)
- ¿Todas las unidades son iguales? → ERC‑20.
- ¿Cada token es único? → ERC‑721.
- ¿Necesitas manejar muchos tipos y hacer batch? → ERC‑1155.
- ¿Quiero aprobar con firma sin gas? → añade EIP‑2612 a tu ERC‑20.
- ¿Mi NFT requiere informar regalías? → implementa EIP‑2981.
- ¿Bóveda/estrategia con depósitos de un activo subyacente? → EIP‑4626.

---

## 7) Tokenomics — Resumen práctico
Tokenomics define la economía de tu token: oferta, distribución, utilidad, incentivos y gobernanza. Debe alinear el valor del protocolo con los incentivos de usuarios y contribuidores.

### 7.1 Oferta (Supply)
- Fija vs. Max Cap vs. Inflacionaria vs. Deflacionaria (burns).
- Emisión: premint, minería/staking, emisiones programadas (lineales, halving, curvas), buyback & burn.
- Decimales: 18 es estándar en ERC‑20 (facilita tooling), pero ajusta si tu caso lo requiere.

### 7.2 Distribución inicial y continua
- Asignaciones: equipo, inversores, comunidad, tesorería, liquidity mining/airdrop.
- Vesting y cliffs: evita presión de venta inmediata; transparencia on‑chain (contratos de vesting).
- Fair launch vs. ventas privadas/públicas: trade‑offs de capital y descentralización.

### 7.3 Utilidad (Utility)
- Medio de intercambio, descuentos/fee token, acceso a features, colateral, staking para seguridad o recompensas, gobernanza (si no usas NFTs de voto), incentivos de liquidez (LP tokens).

### 7.4 Gobernanza
- Modelo de voto: 1 token = 1 voto, delegación, quórum, mayorías, timelocks, propuestas ejecutables (Governor + Timelock, Snapshot off‑chain).
- Riesgos: captura de gobernanza, baja participación, bribing. Mitigar con delegaciones activas y límites.

### 7.5 Liquidez y mercado
- Listado en AMMs (Uniswap, etc.), profundidad y slippage, incentivos a LPs, lockups.
- Puentes/bridges y multichain: riesgo adicional; considera si realmente lo necesitas.

### 7.6 Mecanismos de valor y riesgos
- Tasas/impuestos de transferencia: añaden fricción, posible incompatibilidad con integraciones; sé claro y compatible.
- Buybacks, burns, revenue share: evalúa sostenibilidad y cumplimiento regulatorio.
- Oráculos/precios: evita manipulaciones; usa TWAP o Chainlink según el caso.

### 7.7 Métricas clave para seguimiento
- Circulating vs. Total/Max supply, emisión diaria, distribución por wallets (Gini), liquidez/volumen, fee capture, runway de tesorería.

### 7.8 Checklist de un‑pager de tokenomics
- [ ] Objetivo y utilidad del token
- [ ] Oferta (máxima, inicial, emisiones) y calendario
- [ ] Distribución y vesting (tablas claras) 
- [ ] Gobernanza (on/off‑chain, delegación, quorum)
- [ ] Política de liquidez (AMMs, incentivos, bridges)
- [ ] Riesgos y cumplimiento (jurisdicción, disclosures)
- [ ] Plan de comunicación y transparencia on‑chain (dashboards)

---

## 8) Buenas prácticas al implementar tokens
- Usa OpenZeppelin Contracts y sus extensiones en lugar de escribir desde cero.
- Emite eventos en cambios de estado críticos (`Transfer`, `Approval`, `Mint`, `Burn`).
- Evita lógicas de impuestos no estándar si buscas amplia interoperabilidad.
- Documenta claramente decimales, supply, y direcciones de contratos (verificados en Etherscan).
- Para upgrades, usa patrones de proxy bien auditados o evita upgrades si no son indispensables.

---

## 9) Recursos recomendados
- Ethereum Docs — Estándares de tokens: https://ethereum.org/en/developers/docs/standards/tokens/
- EIP‑20 (ERC‑20): https://eips.ethereum.org/EIPS/eip-20
- EIP‑721 (NFT): https://eips.ethereum.org/EIPS/eip-721
- EIP‑1155 (Multi Token): https://eips.ethereum.org/EIPS/eip-1155
- EIP‑165 (interfaces): https://eips.ethereum.org/EIPS/eip-165
- EIP‑2612 (permit): https://eips.ethereum.org/EIPS/eip-2612
- EIP‑2981 (regalías NFT): https://eips.ethereum.org/EIPS/eip-2981
- EIP‑4626 (tokenized vaults): https://eips.ethereum.org/EIPS/eip-4626
- OpenZeppelin Contracts (ERC20/721/1155 y extensiones): https://docs.openzeppelin.com/contracts
- OpenZeppelin Wizard: https://wizard.openzeppelin.com/
