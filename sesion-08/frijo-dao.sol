// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * FrijoDAO — Un ejemplo pedagógico de una DAO on-chain con:
 * - Token de gobernanza (ERC20Votes) con capacidad de emisión controlada por la DAO.
 * - Gobernador (Governor) con Timelock para propuestas y votaciones ejecutables.
 * - Votaciones específicas para:
 *   a) Decisión de emisión (mint) de nuevos tokens hacia la tesorería (timelock).
 *   b) Decisión de entrega/asignación de tokens a direcciones (grants/bonos).
 *   c) Encuestas de opinión abiertas a cuentas externas (no vinculantes, 1 persona = 1 voto).
 * - Comentarios extensivos en español, con guía de uso y despliegue al final del archivo.
 *
 * NOTA IMPORTANTE (seguridad): Este contrato es educativo. Para producción:
 * - Auditar el código y los parámetros de gobernanza.
 * - Ajustar quórum, periodos, umbrales y delays a las necesidades reales.
 * - Usar herramientas/contratos de OpenZeppelin Contracts v5.x y prácticas robustas.
 */

// ---------- Imports de OpenZeppelin (Governanza + Tokens) ----------
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ================================================================
//                        TOKEN DE GOBERNANZA
// ================================================================

/**
 * FrijoToken — ERC20 con extensiones de firma (Permit) y votos (ERC20Votes).
 * - La emisión (mint) está restringida al rol MINTER_ROLE que, en el flujo propuesto,
 *   será ejercido por el TimelockControl (tesorería bajo la DAO) tras una propuesta aprobada.
 * - Los titulares pueden delegar su poder de voto (on-chain o por firma) para participar.
 */
contract FrijoToken is ERC20, ERC20Permit, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address initialAdmin)
        ERC20("Frijo Governance Token", "FRIJO")
        ERC20Permit("Frijo Governance Token")
    {
        // Asignamos el rol DEFAULT_ADMIN a una cuenta de bootstrap (luego se revoca/transfiere)
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    /**
     * Emite nuevos tokens a un destinatario.
     * - Restricción: solo cuentas con MINTER_ROLE (típicamente el Timelock de la DAO)
     *   pueden acuñar.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // Requeridos por la herencia múltiple con ERC20Votes
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

// ================================================================
//                           TIMELOCK (TESORERÍA)
// ================================================================

/**
 * FrijoTimelock — Controla la ejecución diferida de propuestas aprobadas.
 * - El Timelock actúa como "tesorería" segura y como ejecutor de llamadas aprobadas.
 * - Se configuran roles PROPOSER/EXECUTOR para que el Governor pueda cola/ejecutar.
 */
contract FrijoTimelock is TimelockController {
    /**
     * @param minDelay    Retraso mínimo (segundos) entre "queue" y "execute".
     * @param proposers   Cuentas con permiso para proponer a la cola (normalmente el Governor).
     * @param executors   Cuentas autorizadas para ejecutar (puede ser el Governor o abierto a cualquiera).
     * @param admin       Admin inicial para bootstrap (luego remover/renunciar).
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}

// ================================================================
//                         GOBERNADOR PRINCIPAL
// ================================================================

/**
 * FrijoGovernor — Núcleo de gobernanza on-chain de la DAO.
 * - Parámetros de ejemplo conservadores para testnets (ajustar para producción):
 *   - votingDelay: 1 bloque (evita flash-loans en el mismo bloque de la propuesta).
 *   - votingPeriod: ~1 semana en Ethereum mainnet ≈ 45818 bloques (ajustar por cadena).
 *   - proposalThreshold: tokens mínimos de poder de voto para crear propuestas (0 aquí).
 *   - quorum: fracción del poder delegado (p.ej., 4%).
 * - Se apoya en el Timelock para la ejecución de llamadas a otros contratos.
 */
contract FrijoGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(IVotes _token, FrijoTimelock _timelock)
        Governor("FrijoGovernor")
        GovernorSettings(
            /* votingDelay  */ 1,
            /* votingPeriod */ 45818, // ~1 semana en Ethereum L1; ajustar según red
            /* threshold    */ 0
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% de quórum como ejemplo
        GovernorTimelockControl(_timelock)
    {}

    // ----- Overrides obligatorios por la herencia múltiple -----

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

// ================================================================
//                       COORDINADOR / FACILIDADES DAO
// ================================================================

/**
 * FrijoDAO — Contrato auxiliar para:
 * - Facilitar propuestas pre-empaquetadas para emisión y entrega de tokens.
 * - Mantener encuestas de opinión no vinculantes (1 address = 1 voto) abiertas a EOAs/externos.
 * - Proveer funciones utilitarias y eventos para analytics.
 *
 * Patrón de custodia recomendado:
 * - La "tesorería" real es el Timelock; este contrato NO debe quedar con privilegios peligrosos.
 * - Para emitir, el Timelock debe tener MINTER_ROLE en el token.
 * - Para entregar, el Timelock debe tener saldo de tokens (emitidos previamente hacia sí mismo).
 */
contract FrijoDAO is AccessControl, ReentrancyGuard {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    FrijoToken public immutable token;
    FrijoGovernor public immutable governor;
    FrijoTimelock public immutable timelock;

    // --------------------- Encuestas de Opinión ---------------------
    enum OpinionChoice { Abstain, Yes, No }

    struct OpinionPoll {
        string titulo;                // Título corto
        string descripcion;           // Descripción pedagógica de qué se consulta
        uint64 startTime;             // Tiempo de inicio (unix)
        uint64 endTime;               // Tiempo de cierre (unix)
        uint32 yesCount;              // Conteo de votos "Yes"
        uint32 noCount;               // Conteo de votos "No"
        uint32 abstainCount;          // Conteo de votos "Abstain"
        bool archived;                // Marcador para listados
        mapping(address => bool) voted;  // Registro de 1-persona-1-voto (por address)
    }

    uint256 public pollCount;
    mapping(uint256 => OpinionPoll) private polls; // storage con mapping interno

    event OpinionPollCreated(uint256 indexed pollId, string titulo, uint64 startTime, uint64 endTime);
    event OpinionVoted(uint256 indexed pollId, address indexed voter, OpinionChoice choice);
    event OpinionPollArchived(uint256 indexed pollId);

    // ---------------- Propuestas pre-empaquetadas (helper) ----------------
    event EmissionProposalCreated(uint256 proposalId, uint256 amount);
    event DeliveryProposalCreated(uint256 proposalId, address[] recipients, uint256[] amounts);

    constructor(FrijoToken _token, FrijoGovernor _governor, FrijoTimelock _timelock, address admin) {
        token = _token;
        governor = _governor;
        timelock = _timelock;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNOR_ROLE, address(_governor));
    }

    // --------------------------- ENCUESTAS ---------------------------

    /**
     * Crea una encuesta de opinión abierta. No requiere poseer tokens.
     * - 1 address = 1 voto (sin ponderación). Resultado NO vinculante.
     */
    function createOpinionPoll(
        string memory titulo,
        string memory descripcion,
        uint64 startTime,
        uint64 endTime
    ) external returns (uint256 pollId) {
        require(bytes(titulo).length > 0, "titulo requerido");
        require(endTime > startTime && endTime > block.timestamp, "rango de tiempo invalido");

        pollId = ++pollCount;
        OpinionPoll storage p = polls[pollId];
        p.titulo = titulo;
        p.descripcion = descripcion;
        p.startTime = startTime;
        p.endTime = endTime;
        emit OpinionPollCreated(pollId, titulo, startTime, endTime);
    }

    /**
     * Vota en una encuesta de opinión. No necesita tokens, pero 1 voto por address.
     */
    function voteOpinion(uint256 pollId, OpinionChoice choice) external {
        OpinionPoll storage p = polls[pollId];
        require(bytes(p.titulo).length != 0, "poll inexistente");
        require(block.timestamp >= p.startTime && block.timestamp <= p.endTime, "fuera de ventana");
        require(!p.voted[msg.sender], "ya votado");

        p.voted[msg.sender] = true;
        if (choice == OpinionChoice.Yes) {
            p.yesCount += 1;
        } else if (choice == OpinionChoice.No) {
            p.noCount += 1;
        } else {
            p.abstainCount += 1;
        }
        emit OpinionVoted(pollId, msg.sender, choice);
    }

    /**
     * Obtiene el resumen de una encuesta.
     */
    function getOpinionPoll(uint256 pollId)
        external
        view
        returns (
            string memory titulo,
            string memory descripcion,
            uint64 startTime,
            uint64 endTime,
            uint32 yesCount,
            uint32 noCount,
            uint32 abstainCount,
            bool archived
        )
    {
        OpinionPoll storage p = polls[pollId];
        require(bytes(p.titulo).length != 0, "poll inexistente");
        return (p.titulo, p.descripcion, p.startTime, p.endTime, p.yesCount, p.noCount, p.abstainCount, p.archived);
    }

    /** Marca una encuesta como archivada (no afecta resultados, solo para UIs). */
    function archiveOpinionPoll(uint256 pollId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        OpinionPoll storage p = polls[pollId];
        require(bytes(p.titulo).length != 0, "poll inexistente");
        p.archived = true;
        emit OpinionPollArchived(pollId);
    }

    // -------------------- PROPUESTAS DE EMISION --------------------

    /**
     * Crea una propuesta on-chain para EMITIR nuevos tokens hacia la tesorería (Timelock).
     * Requisitos previos:
     * - El Timelock ("timelock") debe tener el rol MINTER_ROLE en el token.
     *
     * Flujo:
     * - Se construye el calldata para token.mint(timelock, amount).
     * - Se llama a governor.propose(...), retornando un proposalId que seguirá el ciclo normal.
     */
    function proposeEmission(uint256 amount, string memory description) external returns (uint256 proposalId) {
        require(amount > 0, "amount = 0");

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(token.mint.selector, address(timelock), amount);

        proposalId = governor.propose(targets, values, calldatas, description);
        emit EmissionProposalCreated(proposalId, amount);
    }

    // -------------------- PROPUESTAS DE ENTREGA --------------------

    /**
     * Crea una propuesta on-chain para ENTREGAR/ASIGNAR tokens desde la tesorería (Timelock)
     * hacia una lista de destinatarios y montos.
     * Requisitos previos:
     * - El Timelock debe tener saldo suficiente del token (emitido previamente a sí mismo).
     *
     * Nota: Para minimizar gas, considerar agrupar en lotes razonables o usar un contrato
     * intermediario con función batch si el número de destinatarios es muy grande.
     */
    function proposeDelivery(
        address[] memory recipients,
        uint256[] memory amounts,
        string memory description
    ) external returns (uint256 proposalId) {
        require(recipients.length == amounts.length, "longitudes dispares");
        require(recipients.length > 0, "sin destinatarios");

        uint256 n = recipients.length;
        address[] memory targets = new address[](n);
        uint256[] memory values = new uint256[](n);
        bytes[] memory calldatas = new bytes[](n);

        for (uint256 i = 0; i < n; i++) {
            require(recipients[i] != address(0), "destinatario cero");
            require(amounts[i] > 0, "monto cero");
            targets[i] = address(token);
            values[i] = 0;
            // Llamaremos al token.transfer(recipient, amount) PERO ejecutado por el Timelock
            calldatas[i] = abi.encodeWithSelector(ERC20.transfer.selector, recipients[i], amounts[i]);
        }

        proposalId = governor.propose(targets, values, calldatas, description);
        emit DeliveryProposalCreated(proposalId, recipients, amounts);
    }

    // ------------------------ Utilitarios ------------------------

    /**
     * Vista rápida: dirección que efectivamente ejecutará las propuestas aprobadas.
     * Suele ser el propio Timelock.
     */
    function executor() external view returns (address) {
        // En este diseño el ejecutor efectivo de las propuestas es el Timelock
        // (el Governor encola y el Timelock ejecuta). Devolvemos su dirección.
        return address(timelock);
    }
}

/*
====================================================================
                       GUIA DE DESPLIEGUE Y USO
====================================================================
1) Desplegar el Token (FrijoToken)
   - constructor(initialAdmin) → usar una cuenta de bootstrap (se recomienda un multisig temporal)
   - Esta cuenta tendrá DEFAULT_ADMIN_ROLE en el token.

2) Desplegar el Timelock (FrijoTimelock)
   - minDelay: p.ej., 2 días → 2 * 24 * 60 * 60
   - proposers: [direccion_del_Governor] (a configurar luego; por ahora puede estar vacío y se reconfigura)
   - executors: [direccion_del_Governor] o [] para que cualquiera pueda ejecutar
   - admin: cuenta bootstrap (luego renunciar a admin al finalizar la configuración)

3) Desplegar el Governor (FrijoGovernor)
   - Pasar la dirección del token (como IVotes) y del Timelock.
   - Ajustar parámetros en el constructor si es necesario (delay, period, threshold, quorum).

4) Configurar roles y permisos
   - En el Token: otorgar MINTER_ROLE al Timelock → token.grantRole(MINTER_ROLE, timelock).
   - En el Timelock: otorgar PROPOSER_ROLE y EXECUTOR_ROLE al Governor si no se hizo en el deploy.
   - Revocar DEFAULT_ADMIN_ROLE del deployer en Token y Timelock si se desea plena descentralización.

5) Desplegar FrijoDAO (coordinador)
   - constructor(token, governor, timelock, admin)
   - Este contrato provee funciones helper para proponer emisiones y entregas, y para encuestas de opinión.

6) Flujo de emisión
   - Llamar a FrijoDAO.proposeEmission(amount, description)
     → crea propuesta que llama a token.mint(timelock, amount) cuando se ejecute.
   - Votar con tokens delegados (usar ERC20Votes: delegar si es primera vez).
   - Si Succeeds → queue → execute tras minDelay → Timelock acuña tokens hacia sí mismo.

7) Flujo de entrega
   - Llamar a FrijoDAO.proposeDelivery([recipients], [amounts], description)
     → crea propuesta para que el Timelock ejecute token.transfer(recipient, amount) en cada destino.
   - Votar/ejecutar como en el flujo de emisión.

8) Encuestas de opinión
   - createOpinionPoll(titulo, descripcion, start, end)
   - voteOpinion(pollId, choice) por cualquier address (1 voto por address). No vinculante.
   - getOpinionPoll(pollId) para leer resultados.

9) Buenas prácticas
   - Iniciar con quórum y periodos conservadores para garantizar participación real.
   - Usar foros/Snapshot para fase de temperatura antes de gastar gas on-chain.
   - Asegurar que el Timelock sea el propietario/administrador de contratos críticos del protocolo.
   - Considerar mecanismos anti-captura (delegación activa, quórum dinámico, límites de gasto por propuesta).

10) Testing
   - Probar fin a fin en testnet (Sepolia/Holesky) con Foundry/Hardhat.
   - Verificar que las llamadas target (mint/transfer) se ejecutan desde el Timelock (msg.sender = timelock).

Referencias:
- OpenZeppelin Contracts v5.x Governance: https://docs.openzeppelin.com/contracts/5.x/governance
- ERC20Votes: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Votes
- TimelockController: https://docs.openzeppelin.com/contracts/5.x/api/governance#TimelockController
*/
