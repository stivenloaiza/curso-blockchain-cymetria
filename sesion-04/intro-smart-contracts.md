# Introducción técnica a los Smart Contracts

## ¿Qué es un Smart Contract?
Un smart contract (contrato inteligente) es un programa inmutable que se ejecuta de forma determinista en la blockchain, típicamente dentro de la Ethereum Virtual Machine (EVM). Un contrato tiene:
- Código (bytecode) desplegado en una dirección propia (cuenta de contrato).
- Estado persistente (storage) en la cadena.
- Una interfaz pública (ABI) para interactuar mediante transacciones y llamadas.

Características clave:
- Determinismo: para una misma entrada y estado, siempre produce el mismo resultado.
- Inmutabilidad del código: una vez desplegado, su bytecode no cambia (los upgrades requieren patrones de proxy o nuevos despliegues).
- Atomicidad: cada transacción o se ejecuta por completo o revierte.
- Transparencia/verificabilidad: el estado y el código (si el contrato está verificado) son públicos.
- Composabilidad: los contratos pueden llamarse entre sí como “legos” financieros/lógicos.

## Cuentas en Ethereum: EOAs vs Contratos
- EOA (Externally Owned Account): controlada por una clave privada (cartera/MetaMask). Puede firmar y enviar transacciones.
- Cuenta de contrato: no tiene clave privada. Su código responde cuando una transacción o una llamada lo invoca.

Despliegue: se envía una transacción con `initcode` (bytecode de creación + datos del constructor). La EVM ejecuta ese código de creación, cuyo resultado es el `runtime bytecode` que queda almacenado en la dirección del contrato.

## ABI y Selectores de Función
El ABI (Application Binary Interface) especifica cómo codificar/decodificar entradas y salidas. Para invocar `transfer(address,uint256)`, el cliente envía:
- Selector de función: los primeros 4 bytes de `keccak256("transfer(address,uint256)")`.
- Argumentos codificados ABI.
Los eventos se registran como logs con “topics”; el primero suele ser `keccak256("NombreEvento(tipo1,tipo2,...)")`.

## Modelo de ejecución de la EVM
- Stack: pila de 1024 elementos (palabras de 256 bits) para operar.
- Memory: volátil por llamada, direccionable por bytes.
- Storage: persistente, direccionado por slots de 32 bytes; costoso en gas.
- Calldata: datos de entrada de solo lectura para funciones externas.
- Returndata: buffer de salida de llamadas internas/externas.
- Gas: cada operación consume gas; si se agota, la ejecución revierte.

Opcodes y costos están estandarizados (ver evm.codes). Operaciones como `SSTORE` (escritura en storage) son caras; lecturas (`SLOAD`) también tienen costo relevante. Existe reembolso de gas para ciertas operaciones (p. ej., limpiar storage), con límites.

## Estado y almacenamiento
- Cada variable de estado se asigna a slots de 32 bytes. Tipos pequeños pueden empacarse (packing) en un mismo slot para ahorrar gas.
- `mapping(K=>V)`: no es iterable; el valor se localiza en `keccak256(encode(key) ++ slotBase)`.
- Arrays dinámicos y `bytes/string` almacenan longitud y datos fuera de línea base, según reglas del layout de Solidity.

## Historia breve
- 1994: Nick Szabo acuña el término “smart contracts” (concepto teórico de contratos auto‑ejecutables).
- 2009–2012: Bitcoin introduce un lenguaje de script limitado (no Turing-complete) para condiciones de gasto.
- 2015: Nace Ethereum con la EVM (Turing-complete), habilitando smart contracts generales.
- 2016: The DAO hack → hard fork; marca un hito en seguridad y gobernanza.
- 2018–2021: Evolución de Solidity (0.4.x → 0.8.x). Desde 0.8.0, overflow/underflow lanza excepción por defecto.
- 2023: EIP‑6780 cambia la semántica de `SELFDESTRUCT`; suprime borrado total del código/estado en la mayoría de contextos.

## Seguridad esencial (resumen)
- Reentrancy: usar patrón Checks‑Effects‑Interactions, `ReentrancyGuard`, o `pull payments`.
- Overflows: Solidity ≥0.8 revierte por defecto; para optimizaciones usar `unchecked {}` con cuidado.
- Control de acceso: `Ownable`/`AccessControl` (OpenZeppelin), usa modifiers y eventos administrativos.
- Frontrunning/MEV: considerar commit‑reveal, límites de slippage, o mecanismos anti‑sandwich.
- Oráculos y precios: validar fuentes, usar oráculos robustos (Chainlink), manejar fallback.

## Ciclo de vida de un contrato
1) Diseño y codificación (Solidity).  
2) Compilación (`solc`, Remix, Hardhat/Foundry): produce ABI + bytecode.  
3) Despliegue (transacción con `initcode`).  
4) Interacción (lecturas gratuitas vía `eth_call`; escrituras con gas vía `eth_sendTransaction`).  
5) Logs/Eventos para notificaciones off‑chain.  
6) Mantenimiento: migraciones, upgrades con proxy o contratos nuevos.

## Ejemplo mínimo: "Hola Blockchain"
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HolaBlockchain {
    string private saludo;
    event SaludoActualizado(string nuevoSaludo);

    constructor(string memory _saludoInicial) {
        saludo = _saludoInicial;
    }

    function leer() external view returns (string memory) {
        return saludo;
    }

    function escribir(string calldata _nuevo) external {
        saludo = _nuevo;
        emit SaludoActualizado(_nuevo);
    }
}
```

## Recursos recomendados
- EVM y opcodes: https://www.evm.codes/
- Solidity (docs): https://docs.soliditylang.org/
- Ethereum — Smart contracts: https://ethereum.org/en/developers/docs/smart-contracts/
- OpenZeppelin — Contratos y seguridad: https://docs.openzeppelin.com/contracts
