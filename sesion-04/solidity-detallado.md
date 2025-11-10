# Guía detallada de Solidity (0.8.x)

Esta guía explica Solidity paso a paso, con ejemplos mínimos que puedes pegar en Remix, errores comunes y ejercicios cortos. La meta es que entiendas el "por qué" de cada concepto y puedas usarlo con seguridad.

> Versión recomendada: Solidity 0.8.20+ (chequeos aritméticos por defecto y mejoras de seguridad/optimizer). Ajusta según tus dependencias (p. ej., OpenZeppelin).

## Cómo usar esta guía
- Lee cada sección en orden: primero la idea, luego el ejemplo y por último el ejercicio.
- Abre Remix (https://remix.ethereum.org), crea un archivo `.sol`, pega el snippet, compila y prueba.
- Cuando veas "Errores comunes", intenta provocar el error y arreglarlo.

## Requisitos previos
- Conocer qué es la EVM, gas y transacciones (ver guía de la sesión 04).
- Tener MetaMask y saber cambiar a una testnet (Sepolia) para pruebas con Ether falso.

## Convenciones del documento
- Código listo para compilar: cada bloque incluye `pragma` y un contrato contenedor.
- Nombres en español y ejemplos simples.
- Términos clave en monospace como `storage`, `calldata`, `delegatecall`.

## Tabla de contenidos
1) Estructura básica del contrato
2) Tipos y visibilidad
3) Ubicación de datos: `storage`, `memory`, `calldata`
4) Structs, enums, arrays y mappings
5) Modificadores, eventos y errores
6) `receive`, `fallback` y envío de ETH
7) Herencia, interfaces y librerías
8) Llamadas externas, `try/catch` y patrón CEI
9) ABI, selectores y `delegatecall`
10) Layout de storage y optimización de gas
11) Seguridad esencial
12) Versionado, imports y ecosistema
13) Ejemplos rápidos y prácticas
14) Recursos

---

## 1) Estructura básica del contrato
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Ejemplo {
    // 1. Variables de estado (storage persistente)
    uint256 public contador;

    // 2. Eventos (logs para notificaciones off-chain)
    event Incrementado(address indexed por, uint256 nuevoValor);

    // 3. Constructor (se ejecuta 1 sola vez al desplegar)
    constructor(uint256 _inicial) {
        contador = _inicial;
    }

    // 4. Funciones (lógica del contrato)
    function inc() external {
        contador += 1; // revierte en overflow por defecto en 0.8+
        emit Incrementado(msg.sender, contador);
    }
}
```

Elementos estándar:
- `SPDX-License-Identifier`: etiqueta de licencia en el comentario superior.
- `pragma solidity ^0.8.20;`: versión mínima/compatible del compilador.
- `contract`, `interface`, `library`: unidades básicas del lenguaje.

Idea clave:
- Un contrato es como una clase con estado persistente (`storage`) y funciones que lo modifican.
- Las funciones pueden emitir `eventos` que se registran en logs para que apps externas los escuchen.

Ejercicio en Remix (2 min):
1) Despliega `Ejemplo` con `_inicial = 5`.
2) Llama `inc()` dos veces y revisa `contador` y el evento `Incrementado` en la consola de Remix.

Errores comunes:
- Olvidar `pragma` o la licencia: Remix mostrará advertencias o no compilará.
- Hacer pública una variable sensible (usa `private`/`internal` + getters controlados).

---

## 2) Tipos y visibilidad
- Tipos primitivos: `bool`, `address`, `uint<N>`, `int<N>`, `bytes<N>`, `bytes`, `string`.
- `address payable`: permite recibir/transferir ETH.
- Visibilidad de variables/funciones: `public`, `private`, `internal`, `external`.
- `view`: no modifica estado; `pure`: ni lee ni escribe estado; `payable`: permite adjuntar ETH a la llamada.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TiposYVisibilidad {
    uint256 private x;           // solo dentro del contrato
    uint256 internal y;          // contrato + derivados
    uint256 public z;            // getter auto-generado

    function f() public view returns (uint256) { return z; }
    function g() external pure returns (uint256) { return 42; }
    function h() internal payable {}
}
```

Idea clave:
- `public` expone funciones y crea getters automáticos en variables de estado.
- `external` es más barato de llamar desde fuera, pero desde dentro del contrato debes usar `this.g()` (llamada externa) o cambiar la visibilidad.
- `internal` solo en el contrato y sus derivados; `private` solo en el contrato actual.

Ejercicio rápido (2 min):
1) Cambia `g()` a `public` y llámala desde una nueva función `llamaG()` retornando su resultado.
2) Añade una función `setX(uint256 v)` que actualice `x` y otra `getX()` que la lea.

Errores comunes:
- Intentar llamar a una función `external` internamente sin `this.` → usa `public`/`internal` o `this.func()` (más caro).
- Exponer datos sensibles como `public` pensando que “oculta” el valor: todo en la cadena es legible. Usa patrones de autorización, no ocultación.

---

## 3) Ubicación de datos: storage, memory, calldata
- `storage`: persistente en cadena; referencia por defecto para variables de estado.
- `memory`: temporal, vive durante la llamada; para variables locales y parámetros complejos.
- `calldata`: de solo lectura, optimizada para parámetros en funciones `external`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UbicacionDatos {
    struct Persona { string nombre; uint256 edad; }
    Persona public p; // vive en storage

    // 1) Usar calldata para parámetros externos: barato y read-only
    function setNombre(string calldata nuevo) external {
        p.nombre = nuevo; // copia desde calldata a storage
    }

    // 2) Copiar en memory y editar sin afectar storage
    function copiarYEditar(bytes memory datos) public pure returns (bytes memory) {
        bytes memory copia = datos; // vive en memory
        if (copia.length > 0) {
            copia[0] = 0x42; // modifica solo la copia
        }
        return copia;
    }

    // 3) Referencia a storage: edita el estado original en su lugar (barato)
    function cumpleAnios() external {
        Persona storage ref = p; // apuntador a storage
        ref.edad += 1; // modifica storage
    }
}
```

Idea clave:
- `storage` es permanente (paga gas al escribir). Asignar `storage` a una variable local crea un apuntador, no una copia.
- `memory` es una copia temporal que desaparece al terminar la llamada.
- `calldata` es solo lectura y el más barato para parámetros de funciones `external`.

Ejercicio (3–4 min):
1) Añade una función `setEdad(uint256 e)` que asigne directamente en `storage` y otra `leerBytes(string calldata s)` que retorne `bytes(s)`.
2) ¿Qué pasa si intentas escribir en un parámetro `string calldata`? Provoca el error y léelo en Remix.

Errores comunes:
- Usar `memory` en parámetros `external` cuando basta `calldata` (más gas barato).
- Olvidar que `mapping` y arrays dinámicos dentro de structs requieren atención: asignarlos a una variable `storage` crea referencias, no copias profundas.

---

## 4) Structs, enums, arrays y mappings
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Estructuras {
    struct Usuario { string nombre; uint64 edad; }
    enum Estado { Activo, Inactivo }

    Usuario[] public usuarios;            // array dinámico
    mapping(address => uint256) private balances; // no iterable

    function pushUsuario(string calldata _n, uint64 _e) external {
        usuarios.push(Usuario(_n, _e));
    }

    function setBalance(address a, uint256 v) external {
        balances[a] = v; // O(1)
    }

    function getBalance(address a) external view returns (uint256) {
        return balances[a];
    }
}
```
Idea clave:
- `struct` agrupa datos; `enum` representa estados con nombres legibles.
- `array` dinámico crece con `push`; `mapping` es una tabla hash O(1) pero NO es iterable on-chain.

Ejercicio (3–5 min):
1) Añade una función `marcarInactivo(uint index)` que cambie un `Usuario` (en `usuarios`) a inactivo usando un `mapping(uint=>Estado)` separado.
2) Implementa un array `indices` para poder listar direcciones con balance > 0 (hint: guarda las llaves cuando escribes en el mapping).

Errores comunes:
- Intentar iterar un `mapping` directamente: no es posible; necesitas estructuras auxiliares.
- Hacer `delete usuarios[i]` esperando compactar el array: deja un hueco; si necesitas compactar, mueve el último elemento a `i` y haz `pop()`.
- Olvidar el packing: juntar tipos pequeños (ej. `uint64` + `bool`) en el mismo `struct` ayuda a ahorrar gas.

---

## 5) Modificadores, eventos y errores
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error SoloDuenio(); // error personalizado (más barato que string)

contract Acceso {
    address public owner;
    event PropietarioTransferido(address indexed anterior, address indexed nuevo);

    modifier soloOwner() {
        if (msg.sender != owner) revert SoloDuenio();
        _; // ejecuta el cuerpo de la función
    }

    constructor() { owner = msg.sender; }

    function transferOwnership(address nuevo) external soloOwner {
        require(nuevo != address(0), "invalido");
        emit PropietarioTransferido(owner, nuevo);
        owner = nuevo;
    }
}
```
Idea clave:
- Los `modifiers` envuelven lógica común (p. ej., autorización) antes/después del cuerpo de la función.
- Los `eventos` permiten que frontends y servicios indexen y filtren cambios.
- Prefiere `custom errors` (`revert MiError(...)`) sobre strings para ahorrar gas.

Comparativa de errores:
- `require(cond, "mensaje")`: para validar entradas y precondiciones.
- `revert MiError(args)`: mismo efecto que `require` pero más barato al codificar.
- `assert(cond)`: solo para invariantes internas; su fallo consume todo el gas restante (indica bug).

Ejercicio (3 min):
1) Agrega una función `soloOwnerDo()` protegida con `soloOwner` que emita un evento `HizoAlgo()`.
2) Cambia el `require` por un `revert` con un `custom error` cuando `nuevo == address(0)`.

Errores comunes:
- Olvidar poner `_;` dentro del `modifier` → el cuerpo de la función nunca se ejecuta.
- Usar `assert` para validar inputs de usuario: utiliza `require` o `revert` con error personalizado.

---

## 6) receive, fallback y envío de ETH
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Pagos {
    event Recibido(address from, uint256 value);

    // Se dispara cuando el contrato recibe ETH sin datos
    receive() external payable { emit Recibido(msg.sender, msg.value); }

    // Se dispara cuando no existe la función llamada o el selector no coincide
    fallback() external payable {
        // opcionalmente payable para aceptar ETH con datos arbitrarios
    }

    function pagar(address payable to) external payable {
        // Enviar ETH usando call (recomendado post EIP-1884)
        (bool ok, ) = to.call{value: msg.value}("");
        require(ok, "transferencia fallo");
    }
}
```
Idea clave:
- Usa `receive()` para recibir ETH “simple” y `fallback()` como último recurso ante selectores desconocidos.
- Prefiere `call{value: X}` en envíos de ETH; protege funciones que mueven fondos con patrones contra reentrancy.

Ejercicio (3 min):
1) Envía 0.01 ETH a `Pagos` desde Remix (Deploy & Run → Value) y observa el evento `Recibido`.
2) Agrega una función que distribuya ETH a dos direcciones y protégela siguiendo CEI (sección 8).

Errores comunes:
- Confiar en `transfer`/`send`: pueden fallar por límite de gas; usa `call` y controla el retorno.
- Escribir lógica compleja dentro de `fallback`: es un “último recurso”, mantenla mínima y segura.

---

## 7) Herencia, interfaces y librerías
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function transfer(address,uint256) external returns (bool);
}

abstract contract Base { function hook() public virtual {} }

library MathLib { function max(uint a, uint b) internal pure returns (uint) { return a>b?a:b; } }

contract Token is Base, IERC20 {
    using MathLib for uint;

    string public name = "Ejemplo";
    mapping(address=>uint256) private _bal;
    uint256 private _supply;

    function hook() public override {}
    function totalSupply() external view returns (uint256){ return _supply; }
    function balanceOf(address a) external view returns (uint256){ return _bal[a]; }
    function transfer(address to, uint256 v) external returns (bool){
        _bal[msg.sender] -= v; // 0.8+ revierte en underflow
        _bal[to] += v;
        return true;
    }
}
```
Idea clave:
- Una `interface` define el “contrato” (firmas) sin implementación, ideal para interactuar con contratos externos.
- La herencia permite reutilizar código; usa `virtual` en la base y `override` en la derivada.
- `library` agrupa funciones reutilizables; con `using Lib for Tipo` puedes invocarlas como métodos.

Ejercicio (4–6 min):
1) Marca `hook()` en `Base` como `virtual` y sobreescríbela en `Token` para que emita un evento.
2) Agrega en `MathLib` una función `min(uint,uint)` y úsala en `Token` con `using`.
3) Añade una función `mint` (solo para pruebas) que incremente `_bal[msg.sender]` y `_supply`, y prueba `transfer`.

Errores comunes:
- Olvidar `override` cuando sobreescribes funciones (compilador falla).
- Cambiar el orden de herencia y romper resoluciones de método en diamante (C3 linearization): sé explícito con `override(Base1, Base2)`.
- En bibliotecas externas (no `internal`), entender que se enlazan por `DELEGATECALL`: cuidado con efectos en `msg.sender`/storage.

---

## 8) Llamadas externas, try/catch y patrones CEI
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IExt { function foo(uint x) external returns (uint); }

contract Caller {
    uint public ultimo;

    function callFoo(address target, uint x) external returns (uint) {
        // Checks
        require(target != address(0), "target cero");
        // Effects
        ultimo = x;
        // Interactions (externas) al final
        try IExt(target).foo(x) returns (uint r) {
            return r;
        } catch (bytes memory /*lowLevelData*/) {
            return 0; // fallback seguro
        }
    }
}
```
Idea clave:
- Llamar a otros contratos puede fallar; `try/catch` captura reverts y nos permite una ruta alternativa.
- Sigue CEI: valida primero, actualiza tu estado y al final interactúa con externos para mitigar reentrancy.

Ejercicio (4–5 min):
1) Crea un contrato `Ext` con `function foo(uint x) external pure returns (uint) { require(x%2==0, "impar"); return x+1; }`.
2) Llama `callFoo` con `x=3` y verifica que retorna `0` por el `catch`. Con `x=4` debe retornar `5`.

Errores comunes:
- Actualizar estado después de la interacción externa (rompe CEI y facilita reentrancy).
- Ignorar el valor de retorno de llamadas externas o no manejar `false` en `call`/`send`.

---

## 9) ABI, selectores y `delegatecall`
- Selector de función: 4 bytes de `keccak256("sig")`.
- ABI enc/dec: `abi.encode`, `abi.decode`, `abi.encodeWithSelector`.
- `delegatecall`: ejecuta código externo pero conserva `msg.sender` y storage del contrato llamante. Base para proxys de upgrade.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ABIDemo {
    event Respuesta(bytes data);

    function selectorTransfer() public pure returns (bytes4) {
        // keccak256("transfer(address,uint256)")
        return bytes4(keccak256("transfer(address,uint256)"));
    }

    function lowLevelCall(address target, address to, uint256 amount) external returns (bool, bytes memory) {
        bytes4 sel = this.selectorTransfer(); // 0xa9059cbb
        (bool ok, bytes memory data) = target.call(abi.encodeWithSelector(sel, to, amount));
        emit Respuesta(data);
        return (ok, data);
    }
}
```

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// PELIGRO: ejemplo educativo de delegatecall
contract Lib {
    // slot 0
    uint256 public x;
    function inc() external { x += 1; }
}

contract UsaDelegatecall {
    // Debe tener la MISMA disposición de storage que Lib si Lib escribe en storage
    uint256 public x; // slot 0

    function delegar(address lib) external {
        (bool ok,) = lib.delegatecall(abi.encodeWithSelector(Lib.inc.selector));
        require(ok, "delegatecall fallo");
    }
}
```

Idea clave:
- El selector depende exacto de la firma: sin espacios y con tipos exactos (`address`, `uint256`, etc.).
- `call` permite invocar funciones aún sin tener la interfaz en compilación. Devuelve `(ok, data)`.
- `delegatecall` ejecuta el código del objetivo en TU almacenamiento → enorme riesgo si layouts no coinciden.

Ejercicio (5–7 min):
1) Calcula el selector de `balanceOf(address)` y compáralo con el conocido `0x70a08231`.
2) Usa `lowLevelCall` para llamar `transfer` de un token ERC‑20 en Sepolia (necesitas dirección del token y tener saldo en esa cuenta de pruebas).
3) Modifica `UsaDelegatecall` agregando una variable antes de `x` y observa (con una llamada a `inc`) cómo cambia el slot equivocado. Luego reordena para corregir.

Errores comunes:
- Firmas mal escritas al calcular selectores (p. ej., `uint` vs `uint256`).
- Usar `delegatecall` con librerías no confiables o con diferente layout de storage.
- Ignorar `ok` en `call` y asumir éxito; siempre valida y maneja `data`.

Cuidado: usa `delegatecall` solo con patrones consolidados (UUPS, Transparent Proxy de OpenZeppelin) y auditorías.

---

## 10) Layout de storage y optimización de gas
- Packing de tipos pequeños para compartir slots.
- Usa `immutable` (asignación en constructor, lectura barata) y `constant` (incrusta literal en bytecode).
- Prefiere `calldata` en parámetros externos y `memory` solo cuando edites/copias.
- Custom errors en vez de strings.
- Índices `indexed` en eventos para filtros más eficientes.
- `unchecked { ... }` para bucles cuidadosamente analizados.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Optimizacion {
    // 1) constants e immutables
    uint256 public constant FEE_BPS = 30; // 0.3%
    address public immutable TREASURY;

    // 2) Packing: cabe en 1 slot de 32 bytes (uint64 + uint64 + bool -> bool ocupa 1 byte)
    struct Packed {
        uint64 a;
        uint64 b;
        bool activo; // ocupa 1 byte
        // quedan bytes libres en este slot
    }
    Packed public packed;

    constructor(address t) { TREASURY = t; }

    function setPacked(uint64 a, uint64 b, bool activo) external {
        packed = Packed(a, b, activo);
    }

    // 3) Bucles en unchecked cuando sabes que no hay overflow
    function suma(uint256 n) external pure returns (uint256 acc) {
        for (uint256 i = 0; i < n; ) {
            acc += i;
            unchecked { i++; } // ahorra gas al omitir el chequeo del overflow
        }
    }
}
```
Idea clave:
- El orden de los campos en un `struct` afecta el packing: agrupa tipos pequeños juntos para llenar slots.
- `constant` ahorra almacenamiento (literal en bytecode). `immutable` evita una escritura posterior, lectura barata.

Ejercicio (4–6 min):
1) Reordena los campos de `Packed` para forzar que ocupen 2 slots y observa el gas al escribir.
2) Quita `unchecked` y compara el gas de `suma(1000)`.

Errores comunes:
- Mezclar tipos grandes y pequeños en desorden y perder packing.
- Usar `memory` innecesariamente en parámetros `external` (usa `calldata`).
- Olvidar `indexed` en eventos que necesitas filtrar desde el frontend.

Tips de gas rápidos:
- Usa `custom errors` en lugar de strings.
- Prefiere `++i` con `unchecked` en bucles con límites controlados.
- Evita escribir en `storage` dentro de loops; acumula en memoria y luego escribe.

---

## 11) Seguridad esencial
- Reentrancy: CEI, `ReentrancyGuard`, pull payments.
- Autorización: `Ownable`/`AccessControl`.
- Frontrunning/MEV: usar tolerancias, commit-reveal, firmas off-chain.
- Oráculos: valida y maneja fallas; evita dependencia de un único feed.
- `tx.origin`: no lo uses para auth; usa `msg.sender`.
- Inicialización de proxys: evita quedar sin owner.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Ejemplo vulnerable a reentrancy (didáctico)
contract CofreVulnerable {
    mapping(address => uint256) public saldo;

    function depositar() external payable {
        saldo[msg.sender] += msg.value;
    }

    function retirar() external {
        uint256 monto = saldo[msg.sender];
        require(monto > 0, "sin fondos");
        // MALO: interactua antes de actualizar el estado
        (bool ok,) = msg.sender.call{value: monto}("");
        require(ok, "envio fallo");
        saldo[msg.sender] = 0; // efecto tarde → vulnerable
    }
}

// Versión segura con CEI + pull payments
contract CofreSeguro {
    mapping(address => uint256) public saldo;
    error SinFondos();

    function depositar() external payable {
        saldo[msg.sender] += msg.value;
    }

    function retirar() external {
        uint256 monto = saldo[msg.sender];
        if (monto == 0) revert SinFondos();
        // CEI: actualizar estado antes de la interacción externa
        saldo[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: monto}("");
        require(ok, "envio fallo");
    }
}
```
Idea clave:
- Reentrancy sucede cuando un contrato externo ejecuta su `fallback/receive` y vuelve a llamar a tu función antes de que termines. CEI lo mitiga.
- Alternativa: usar `ReentrancyGuard` (OpenZeppelin) o diseño de pagos por retiro (pull payments).

Checklist rápido:
- [ ] Sin warnings del compilador
- [ ] Funciones sensibles emiten eventos y tienen tests
- [ ] Límites y validaciones de entrada (`require`/`revert`)
- [ ] Manejo explícito de errores en llamadas externas y envíos de ETH
- [ ] Roles y permisos definidos (Ownable/AccessControl)

Ejercicio (3–5 min):
1) Implementa un atacante para `CofreVulnerable` que drene fondos reentrando en `retirar`.
2) Comprueba que `CofreSeguro` resiste el ataque.

Errores comunes:
- Usar `tx.origin` para autorización (phishing). Usa `msg.sender` y roles.
- No validar retornos en `call`/`delegatecall`.
- No inicializar correctamente proxys (contratos upgradeables) dejando el owner en cero.

---

## 12) Versionado, imports y ecosistema
- Fija versiones de compilador en producción para reproducibilidad (p. ej., `pragma solidity 0.8.24;`). Evita rangos amplios (`^`) en contratos críticos.
- Imports:
  - En Remix puedes importar por URL de GitHub: `import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/access/Ownable.sol";`
  - En proyectos (Hardhat/Foundry) usa paquetes NPM: `import "@openzeppelin/contracts/access/Ownable.sol";`
- Tooling popular:
  - Hardhat (JS/TS): plugins, forking, verificación en Etherscan.
  - Foundry (Rust): `forge test`, fuzzing, gas snapshots.
  - Truffle (legacy) y Brownie (Python) aún se encuentran en proyectos.

Ejercicio (2–4 min):
1) En Remix, crea un archivo y haz un import por URL de `Ownable.sol` de OpenZeppelin. Compila y hereda `Ownable` en un contrato mínimo.
2) Cambia el pragma a una versión fija (sin caret) y recompila para ver el efecto.

Errores comunes:
- Importar con `@openzeppelin/...` en Remix sin un entorno de NPM: usa URL o activa Remixd con un workspace que tenga `node_modules`.
- Usar una versión de compilador incompatible con una librería: revisa el pragma en los archivos importados.

---

## 13) Ejemplos rápidos y prácticas

### 13.1 Contador con protección de reentrancy (didáctico)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Contador is ReentrancyGuard {
    uint256 public valor;
    event Set(uint256 nuevo);

    function set(uint256 v) external nonReentrant {
        valor = v;
        emit Set(v);
    }
}
```

### 13.2 Uso de errores personalizados y `immutable`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error MontoCero();

contract Cofre {
    address public immutable owner;
    event Deposit(address indexed from, uint256 value);

    constructor(address _owner) { owner = _owner; }

    function deposit() external payable {
        if (msg.value == 0) revert MontoCero();
        emit Deposit(msg.sender, msg.value);
    }
}
```

---

## 14) Recursos
- Documentación oficial Solidity: https://docs.soliditylang.org/
- OpenZeppelin Contracts (implementaciones seguras): https://docs.openzeppelin.com/contracts
- Solidity by Example (patrones y demos): https://solidity-by-example.org/
- EVM opcodes y gas: https://www.evm.codes/
