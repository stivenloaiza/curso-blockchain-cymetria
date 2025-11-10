# Despliegue y ejecución de contratos con Remix

Esta guía explica, paso a paso, cómo compilar, desplegar e interactuar con un smart contract usando Remix IDE y MetaMask en una testnet (Sepolia). Incluye preparación, configuración del compilador, firma de transacciones, lectura/escritura de funciones, eventos, depuración y verificación en Etherscan.

---

## 1) Prerrequisitos
- MetaMask instalado en el navegador y protegido con seed segura.
- Red de prueba configurada (Sepolia). Si no la ves, habilita testnets en MetaMask y agrega Sepolia si es necesario.
- ETH de prueba en tu cuenta (faucet): https://www.alchemy.com/faucets/ethereum-sepolia
- Explorador para verificar transacciones: https://sepolia.etherscan.io/
- Acceso a Remix: https://remix.ethereum.org/

Opcional:
- Documentación Remix: https://remix-ide.readthedocs.io/
- Documentación Etherscan (verificación): https://docs.etherscan.io/tutorials/verifying-contracts

---

## 2) Contrato de ejemplo
Usaremos un contrato sencillo que guarda un saludo y emite un evento cuando cambia.

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

---

## 3) Crear el archivo en Remix
1. Abre https://remix.ethereum.org/
2. En el panel izquierdo (File Explorer), crea una carpeta y un archivo, por ejemplo: `contracts/HolaBlockchain.sol`.
3. Pega el código anterior y guarda el archivo (Ctrl/Cmd + S).

---

## 4) Configurar el compilador en Remix
1. Ve al plugin "Solidity compiler" (icono del compilador).
2. Selecciona versión de compilador 0.8.20 (o compatible con tu código/librerías).
3. Marca "Enable optimization" y establece `200` runs (valor típico) si quieres optimizaciones de gas.
4. Asegúrate de que la EVM target sea "default" o una equivalente a la cadena objetivo.
5. Presiona "Compile HolaBlockchain.sol" y revisa advertencias/warnings.

Notas:
- Warnings del compilador suelen indicar riesgos o malas prácticas; trata de resolverlos cuando sea posible.
- El binario resultante y el ABI aparecen en la pestaña de artefactos del compilador.

---

## 5) Despliegue con MetaMask (Injected Provider)
1. Abre el plugin "Deploy & Run Transactions".
2. En "Environment" elige: `Injected Provider - MetaMask`. MetaMask te pedirá conexión si es la primera vez.
3. Selecciona la red de destino en MetaMask: `Sepolia`.
4. Cuenta: asegúrate de que la cuenta tenga ETH de prueba suficiente.
5. En el selector de contrato, elige `HolaBlockchain`.
6. Constructor: completa el parámetro requerido, por ejemplo: `"Hola, Blockchain"`.
7. Gas y valor:
   - `Value`: para este contrato no es necesario (0). Solo úsalo si tu constructor o función es `payable`.
   - Gas: Remix estima automáticamente el límite. MetaMask usará EIP-1559 (Base Fee + Priority Fee).
8. Click en "Deploy".
9. MetaMask abrirá una ventana para firmar y confirmar la transacción. Confirma y espera la inclusión en la cadena.
10. Al minarse, verás la dirección del contrato en Remix en la sección "Deployed Contracts" y podrás expandirlo.

Consejos:
- Si la estimación de gas falla, revisa el constructor y dependencias. Puedes establecer un gas limit manual moderado (p. ej., 1.000.000) y reintentar.
- Si MetaMask muestra "insufficient funds", obtiene más ETH de prueba o baja la priority fee.

---

## 6) Interacción (lectura y escritura)
En "Deployed Contracts" expande `HolaBlockchain`:
- Llamadas de lectura (`leer`): son gratuitas (se hacen como `eth_call`). Verás el resultado instantáneamente.
- Llamadas de escritura (`escribir`): abren MetaMask para firmar una transacción (`eth_sendTransaction`). Requieren gas y tardan hasta que se confirme.

Eventos:
- Cada vez que llamas a `escribir`, el contrato emite `SaludoActualizado`. En Remix verás los logs en la consola y un enlace a Etherscan.

---

## 7) Depuración con Remix Debugger
1. En la consola de Remix, haz clic en el hash de una transacción enviada por ti.
2. Abre el Debugger para ver el paso a paso (opcodes, stack, memory, storage) y el motivo de errores o reverts.
3. Usa puntos de ruptura (breakpoints) en el editor para navegar más fácil.

---

## 8) Verificación del contrato en Etherscan
Verificar enlaza tu fuente con el bytecode on-chain para transparencia.

Opción A (clásica, en el sitio):
1. Copia la dirección del contrato y ve a https://sepolia.etherscan.io/ → "Contract" → "Verify & Publish".
2. "Compiler Type": Solidity (Single file) o Standard JSON Input si usas múltiples archivos/imports.
3. "Compiler Version": exactamente la usada (ej.: 0.8.20). "License": MIT (según tu encabezado SPDX).
4. Pega el código fuente y las configuraciones (optimizer activado y runs).
5. Si tu contrato tiene constructor con argumentos, Etherscan puede detectarlos, pero confirma que coincidan. También puedes pegarlos ABI-encoded si lo solicita.
6. Envía y espera confirmación de verificación.

Opción B (Remix plugin):
1. En Remix, abre el plugin "Etherscan - Contract Verification" (si no aparece, agréguelo desde el gestor de plugins).
2. Configura tu API key de Etherscan y la red (Sepolia).
3. Selecciona el contrato y ejecuta la verificación desde Remix.

Notas:
- Si usas librerías vinculadas, asegúrate de proporcionar las direcciones de enlace.
- Para proyectos complejos, el modo "Standard JSON Input" reproduce exactamente los parámetros de compilación.

---

## 9) Problemas comunes y soluciones
- Gas estimation failed: revisa require/revert en constructor o dependencias; prueba con gas limit manual; compila sin warnings.
- Constructor arguments mismatch: asegúrate de pasar los mismos argumentos y tipos usados en el despliegue al verificar.
- Wrong network / chainId: verifica que MetaMask esté en Sepolia y que Remix muestre el mismo chainId.
- Insufficient funds: solicita ETH en faucet o reduce priority fee.
- Reverted / invalid opcode: usa el Debugger para detectar la condición exacta (`require`, `assert`, underflow en 0.8- si usaste `unchecked`).
- Library link missing: en verificación, incluye direcciones de librerías o usa el modo de entrada estándar con parámetros de enlace.
- Pragma/compilador incorrecto: la versión debe coincidir exactamente con la usada al compilar.

---

## 10) Buenas prácticas
- Fija la versión de compilador (`pragma solidity ^0.8.20;`) y la licencia SPDX.
- Activa optimizer (200–500 runs típico) para producción, salvo que prefieras bytecode legible.
- Registra eventos en cambios de estado críticos (auditoría y monitoreo off‑chain).
- Usa librerías probadas (OpenZeppelin) y evita reinventar patrones de seguridad.
- Antes de mainnet, prueba en testnet y revisa gas y edge cases.
- No expongas tu seed ni claves privadas; usa hardware wallet cuando sea posible.

---

## 11) Recursos
- Remix — Deploy & Run: https://remix-ide.readthedocs.io/en/latest/run.html
- MetaMask — Testnets: https://support.metamask.io/hc/en-us/articles/4404424659995-How-to-show-or-hide-test-networks-in-MetaMask
- Etherscan — Verificación: https://docs.etherscan.io/tutorials/verifying-contracts
- Sepolia Faucet: https://www.alchemy.com/faucets/ethereum-sepolia
- Solidity — Documentación: https://docs.soliditylang.org/
