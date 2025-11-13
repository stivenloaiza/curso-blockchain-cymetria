# DAOs, Micromecenazgo, Tokens de Gobernanza y Smart Contracts de Votación

Este documento profundiza en la teoría y práctica de las Organizaciones Autónomas Descentralizadas (DAOs), modelos de micromecenazgo (crowdfunding) nativo cripto, el diseño de tokens de gobernanza y los mecanismos de votación, además de un panorama de herramientas modernas para lanzar y operar una DAO.

---

## 1. ¿Qué es una DAO?
Una DAO es una organización coordinada por software y reglas codificadas en smart contracts, donde:
- Las decisiones se toman colectivamente mediante mecanismos de gobernanza (votaciones).
- Los incentivos (económicos, reputacionales) están alineados mediante tokens u otros instrumentos.
- La tesorería y permisos se controlan de forma transparente y programable.

Características clave:
- Transparencia: reglas y decisiones on-chain; historial auditable.
- Permisionless: membresía y participación potencialmente abiertas.
- Automatización: ejecución de decisiones por smart contracts (timelocks, colas, quórum).
- Gobernanza modular: componentes intercambiables (delegación, quórum dinámico, ejecución diferida, roles).

Modelos de DAO comunes:
- Tesorería/Grant DAOs: asignación de fondos para proyectos (ej. Gitcoin Grants DAO).
- Protocolo DeFi: parametrización y upgrades de protocolos (ej. Compound, Aave, Uniswap).
- Coleccionables/NFT: dirección creativa y tesorería (ej. Nouns DAO).
- Infraestructura/ENS: nombres, precios, parámetros.
- DAOs de servicios: cooperativas de talento y agencias descentralizadas.

Ciclo de vida de una propuesta (visión general):
1) Creación de propuesta → 2) Snapshot del poder de voto → 3) Votación → 4) Éxito si supera umbrales (quórum + mayoría) → 5) Cola en Timelock → 6) Ejecución on-chain.

---

## 2. Micromecenazgo (Crowdfunding) en DAOs
El micromecenazgo cripto permite financiar iniciativas colectivamente con trazabilidad y reglas programables.

Enfoques principales:
- Token Launch para Tesorería:
  - Venta de tokens (o bonding curves) para capitalizar la tesorería inicial.
  - Derechos de gobernanza y/o flujos (recompensas, revenue share si corresponde legalmente).
- Grants Program DAO:
  - Recaudación continua y distribución por votación (quadratic funding con Gitcoin/retroPGF).
- SubDAO/Pods para campañas específicas:
  - Comités o “pods” con mandato y límites; votan y ejecutan gastos en su alcance.

Mecanismos a considerar:
- Matching pools: fondos que multiplican donaciones según señal social (quadratic funding).
- Streamings/vesting: liberar fondos al equipo por hitos (Sablier, Superfluid) para accountability.
- Multisig + Gobernanza: tesorería operativa protegida por multisig (Safe) bajo políticas aprobadas por DAO.

Riesgos y mitigaciones:
- Captura por ballenas → uso de quadratic voting/funding, delegación amplia, límites por dirección.
- Coordinación pobre → tooling para foros, RFCs, phases de temperatura, request for proposals (RFPs).
- Compliance/legales → separar entidades legales, términos claros, jurisdicciones amigables.

---

## 3. Tokens de Gobernanza
El token de gobernanza representa poder de voto y/o membresía. Suele ser un ERC‑20 con extensiones de votación por delegación.

Diseño del token:
- Suministro: fijo vs. inflacionario; emisiones por contribución, staking o liquidity mining.
- Distribución: equipo, comunidad, inversores, tesorería, airdrops por uso/contribución.
- Utilidad: voto, staking para seguridad, gating de propuestas, tarifas reducidas, ingresos del protocolo (si aplica regulatoriamente).
- Delegación: los titulares pueden delegar su poder de voto en representantes.

Estándares relevantes:
- ERC‑20: fungible básico.
- ERC20Votes (OpenZeppelin): delegación y checkpoints de poder de voto en cada bloque.
- ERC‑721 + Gobernanza: en DAOs NFT, el poder de voto se pondera por NFT o rasgos.

Métricas a parametrizar:
- Quórum: porcentaje mínimo de participación (e.g., 4% del suministro delegado).
- Umbral de propuesta: tokens mínimos para poder proponer (o delegaciones recibidas).
- Mayoría requerida: simple (>50%), supermayoría (e.g., 66%).
- Delay y Periodo de Votación: ventanas temporales de snapshot y voto.
- Timelock: retraso antes de ejecutar, para dar tiempo a auditoría social.

Antipatrones:
- Quórum muy alto → parálisis.
- Quórum muy bajo → captura fácil.
- Emisiones sin alineación → dilución y apatía.
- Sin delegación activa → baja participación efectiva.

---

## 4. Modelos de Votación
Tipos de votación:
- On-chain (Governor): transparente, ejecutable; coste de gas; seguridad fuerte.
- Off-chain con firma (Snapshot): gasless; resultados socialmente vinculantes; ejecución manual o por puente a on-chain.
- Híbrido: señal en Snapshot + ejecución on-chain si quórum/consenso.

Estrategias de conteo:
- 1 token = 1 voto (ponderado por balance/delegación).
- Quadratic voting: penaliza concentración; requiere identidades o Sybil-resistance.
- Por poder delegado: representantes votan en nombre de muchos.
- Multicadena/multiactivo: estrategias Snapshot que suman poder desde varias chains o NFTs.

Estados típicos de una propuesta on-chain (OpenZeppelin Governor):
- Pending → Active → Defeated/Succeeded → Queued (Timelock) → Executed → Canceled/Expired.

---

## 5. Smart Contracts de Gobernanza (OpenZeppelin Governor)
OpenZeppelin ofrece implementaciones probadas para armar gobernanza on-chain:
- `ERC20Votes`: token con delegación y checkpoints.
- `Governor`: motor de propuestas y votaciones.
- `GovernorSettings`: params de votación (delay, periodo, umbral).
- `GovernorCountingSimple`: mayorías simples; hay variantes (quorum fraction, etc.).
- `GovernorVotes`: integra el token de votos.
- `GovernorTimelockControl` + `TimelockController`: cola y ejecución diferida.

Diagrama de alto nivel:
Token (ERC20Votes) → Governor (propuestas, conteo, quórum) → TimelockController (cola/exec) → Contratos objetivo.

### 5.1. Ejemplo mínimo de Token con Votos (Solidity)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("GovToken", "GOV") ERC20Permit("GovToken") {
        _mint(msg.sender, 100_000_000 ether);
    }

    // Los siguientes overrides se requieren por Solidity para ERC20Votes
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
```

Puntos clave:
- `ERC20Permit` habilita firmas EIP‑2612 (approve por firma, útil para Snapshot/UX).
- `ERC20Votes` crea checkpoints de poder de voto por bloque y soporta `delegate`/`delegateBySig`.

### 5.2. Ejemplo de Governor con Timelock
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract MyGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(IVotes _token, TimelockController _timelock)
        Governor("MyGovernor")
        GovernorSettings(/*votingDelay=*/ 1, /*votingPeriod=*/ 45818, /*proposalThreshold=*/ 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% de quórum
        GovernorTimelockControl(_timelock)
    {}

    // Requeridos por Solidity debido a herencia múltiple
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
        public
        override(Governor)
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    // Soporte de interfaz
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

Checklist de despliegue:
1) Desplegar `GovToken`.
2) Desplegar `TimelockController` con:
   - `minDelay` (e.g., 2 días),
   - `proposers` y `executors` (normalmente el `Governor`),
   - admin temporal para bootstrap (luego renunciar a admin).
3) Desplegar `MyGovernor` con el token y el timelock.
4) Transferir la propiedad de los contratos gobernados al `TimelockController`.
5) Asignar roles: el `Governor` como `PROPOSER_ROLE` y `EXECUTOR_ROLE` en el timelock; remover admin humano.
6) Distribuir/delegar tokens para habilitar quórum.

---

## 6. Parámetros de Gobernanza: Cómo Afinarlos
- Voting Delay: bloques desde propuesta hasta inicio de voto (evita flash borrowing de votos).
- Voting Period: duración del voto; balancear participación vs. agilidad (1–7 días típico).
- Proposal Threshold: evita spam; puede basarse en delegaciones recibidas.
- Quórum Dinámico: % del poder delegado; ajustar por volatilidad de participación.
- Timelock Delay: ventana de reacción post‑voto (24–72 h común).

Buenas prácticas:
- Fase de temperatura (off-chain) antes de on-chain para evitar gas en propuestas flojas.
- Delegación activa y campañas de delegados; dashboards de rendimiento.
- Guardrails: limites de gasto/paramétricos, pausas (circuit breaker), guardian roles en early stage.
- Upgradability: gobernanza del proxy; exigencia de supermayorías y timelocks más largos para upgrades.

---

## 7. Votaciones Off‑chain (Snapshot)
Snapshot permite crear espacios de voto sin gas usando firmas EIP‑712:
- Estrategias: lectura de balances en block heights específicos, multi‑chain, NFT‑based, delegación.
- Tipos de voto: single choice, weighted, approval, ranked choice, quadratic, etc.
- Flujo: propuesta → firma → recolector calcula resultados → ejecución manual o automatizada vía relayers/bridges.

Ventajas:
- Cero gas para votantes; UX superior.
- Flexibilidad de estrategias.

Limitaciones:
- No ejecuta on-chain por sí mismo; requiere puente/honestidad social.

---

## 8. Herramientas del Ecosistema DAO
- Aragon OSx: framework modular para DAOs y plugins de votación/tesorería.
- Tally: dashboard para gobernanza on-chain (Compound/OpenZeppelin Governor compatible).
- Snapshot: votaciones off-chain; múltiples estrategias.
- Safe (Gnosis Safe): multisig para tesorería; módulos y guardián; integración con DAO frameworks.
- OpenZeppelin Contracts & Wizard: contratos auditados y generador de boilerplate para Governor/Timelock/Token.
- Boardroom/Llama: analytics y orquestación de propuestas.
- Agora, Discourse, Commonwealth: foros y discusión.
- Charmverse/Notion: documentación y RFPs.
- Coordinape/SourceCred: reconocimiento y distribución basada en contribución.
- Sablier/Superfluid: payroll y grants por streaming.

Criterios de elección:
- Compatibilidad con tu chain (EVM/L2/multichain).
- Nivel de descentralización requerido vs. UX/costos.
- Comunidad y tooling alrededor del stack (Tally para Governor, etc.).

---

## 9. Seguridad y Riesgos en Gobernanza
Ataques comunes:
- Flash‑loan governance: adquirir votos temporalmente para manipular (mitigación: snapshot en `votingDelay`, excluir balances recientes, usar ERC20Votes con checkpoints por bloque).
- Propuestas maliciosas: límites, revisiones, guardianes temporales, pausas.
- Baja participación: delegación, incentivos de participación, quórum razonable, campañas educativas.
- Admin keys: migrar a timelocks y gobernanza cuanto antes; políticas de rotación/compartición de claves en Safe.

Auditoría y procesos:
- Revisiones de código + simulaciones (Tenderly/Foundry fork tests).
- Canales de disclosure responsable.
- Playbooks de incidentes y rollback bajo reglas aprobadas (requiere previsión contractual).

---

## 10. Patrones de Diseño de DAO
- Modulares: separar gobernanza, tesorería y ejecución.
- Timelock como único admin: contratos críticos bajo `TimelockController`.
- Delegación por dominios: delegados temáticos (riesgo, tesorería, producto) + comités (subDAOs/pods).
- Parámetros evolutivos: gobernanza puede votarse a sí misma (meta‑governance) con mayores requisitos.
- Señal off-chain → ejecución on-chain: híbrido para eficiencia de gas.

---

## 11. Ejemplo de Flujo Completo
1) Lanzamiento del token `GovToken` y distribución inicial.
2) Creación de `TimelockController` y `MyGovernor`.
3) Transferencia de propiedad de contratos del protocolo al timelock.
4) Configuración en Tally para visualización y participación.
5) Uso de Snapshot para señales tempranas.
6) Primera propuesta on-chain: cambiar parámetro `fee` del protocolo.
   - Encode `calldata` para el setter del contrato.
   - `propose(...)` → votar → éxito → `queue(...)` → `execute(...)` tras delay.

---

## 12. Checklist de Lanzamiento Responsable
- [ ] Auditoría interna de contratos y scripts.
- [ ] Parámetros de gobernanza conservadores al inicio (quórum bajo pero seguro; timelocks suficientes).
- [ ] Guardian temporal con mandato limitado y sunset clause.
- [ ] Documentación pública de procesos y riesgos.
- [ ] Plan de comunicación y soporte para delegados.
- [ ] Integraciones con Tally/Snapshot/Safe verificadas.
- [ ] Test de fin a fin en testnet (Goerli/Sepolia/holesky u otra L2 testnet).

---

## 13. Recursos Recomendados
- Ethereum.org — DAOs: https://ethereum.org/en/dao/
- OpenZeppelin Contracts — Governance: https://docs.openzeppelin.com/contracts/5.x/governance
- ERC20Votes: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Votes
- TimelockController: https://docs.openzeppelin.com/contracts/5.x/api/governance#TimelockController
- Compound Governance (Bravo): https://docs.compound.finance/v2/governance/
- Tally Docs: https://docs.tally.xyz/
- Snapshot Docs: https://docs.snapshot.org/
- Aragon OSx: https://devs.aragon.org/
- Safe: https://docs.safe.global/
- EIP‑712: https://eips.ethereum.org/EIPS/eip-712
- Nouns DAO: https://docs.nouns.wtf/
- ENS DAO: https://docs.ens.domains/v/governance/
- OpenZeppelin Wizard: https://wizard.openzeppelin.com/

---

## 14. Glosario Rápido
- Quórum: participación mínima exigida para validar un resultado.
- Umbral de propuesta: poder mínimo para poder proponer.
- Delegación: asignar tu poder de voto a otro.
- Timelock: retraso programado antes de ejecutar decisiones aprobadas.
- Snapshot (off-chain): sistema de votación sin gas con firmas.

---

## 15. Siguientes Pasos Prácticos
- Generar contratos con OpenZeppelin Wizard (Governor + ERC20Votes + Timelock).
- Desplegar en testnet y registrar el espacio en Tally.
- Crear espacio en Snapshot y definir estrategias de voto.
- Configurar Safe como tesorería custodiada por el Timelock/Governor.
- Ejecutar una propuesta de prueba que interactúe con un contrato de parámetro controlado.

---

Navegación: [⬅️ Sesión 8 README](./README.md) · [⬆️ Índice](../README.md)
