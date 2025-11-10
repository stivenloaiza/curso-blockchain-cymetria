# Práctica paso a paso: Despliegue de ERC‑20 y ERC‑721 en Remix (OpenZeppelin)

Esta guía te lleva de la mano para crear, compilar, desplegar y probar un token ERC‑20 (fungible) y un NFT ERC‑721 (no fungible) usando Remix IDE + MetaMask en una testnet (Sepolia), basados en la librería OpenZeppelin.

---

## 1) Prerrequisitos
- MetaMask instalado y configurado en red de prueba Sepolia.
- ETH de prueba (faucet): https://www.alchemy.com/faucets/ethereum-sepolia
- Acceso a Remix: https://remix.ethereum.org/
- Explorador: https://sepolia.etherscan.io/
- (Opcional) Documentación de OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/5.x/

Consejo: Activa el optimizer (200 runs) para contratos "definitivos". Para el curso puedes dejarlo en 200.

---

## 2) Dos caminos para generar el contrato
- Opción A — OpenZeppelin Wizard: genera el contrato con clics y cópialo a Remix.
- Opción B — Escribir el contrato en Remix importando OpenZeppelin por URL.

Ambas funcionan; usa la que prefieras. Aquí mostraremos ambas.

---

## 3) ERC‑20 (fungible)

### 3.1 Opción A: OpenZeppelin Wizard
1. Abre https://wizard.openzeppelin.com/ y elige "ERC20".
2. Configura:
   - Name: por ejemplo, "CursoToken"
   - Symbol: "CTK"
   - Premint: opcional, p. ej. `1000000` con 18 decimales → 1,000,000 CTK a `msg.sender`.
   - Marcas útiles: Mintable, Burnable, Pausable (opcionales).
3. Copia el código generado (botón "Open in Remix" o copiar manual) y pégalo en Remix (archivo `contracts/CursoToken.sol`).
4. Compila en Remix con versión compatible mostrada por Wizard (por ejemplo 0.8.20).

### 3.2 Opción B: archivo manual con imports por URL
Crea en Remix `contracts/CursoToken.sol` y pega:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract CursoToken is ERC20, ERC20Burnable, Ownable {
    constructor(uint256 initialSupply) ERC20("CursoToken", "CTK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

Notas:
- `initialSupply` se pasa en unidades mínimas (wei del token). Para 1,000,000 con 18 decimales: `1000000 * 10**18`.
- `Ownable(msg.sender)` inicializa el owner en el deployer (OpenZeppelin v5).

### 3.3 Despliegue del ERC‑20
1. En Remix, abre "Solidity compiler" y compila `CursoToken.sol` (optimizer on, 200 runs recomendado).
2. Ve a "Deploy & Run Transactions".
3. Environment: `Injected Provider - MetaMask` (selecciona red Sepolia en MetaMask).
4. Elige el contrato `CursoToken`.
5. Constructor: `initialSupply`. Ej.: `1000000e18` (Remix acepta notación científica para 18 decimales).
6. Click "Deploy" y confirma en MetaMask.
7. Una vez minado, verás el contrato desplegado en "Deployed Contracts".

### 3.4 Probar funciones del ERC‑20
- `totalSupply()` y `balanceOf(tu_direccion)` deben reflejar tu premint.
- `transfer(destino, amount)`: mueve tokens a otra cuenta.
- `approve(spender, amount)` + `transferFrom(owner, to, amount)` desde `spender` (requiere allowance previa).
- `burn(amount)` o `burnFrom(owner, amount)` (si habilitaste Burnable y tienes allowance).

### 3.5 Agregar tu ERC‑20 a MetaMask
1. Copia la dirección del token (del despliegue).
2. MetaMask → "Import tokens" → Pega la dirección.
3. MetaMask debe detectar símbolo y decimales. Confirma.

### 3.6 Verificar en Etherscan
- En Remix, usa el plugin "Etherscan - Contract Verification" o verifica manualmente en https://sepolia.etherscan.io/ → Verify & Publish.
- Usa la misma versión de compilador y configuración del optimizer.

---

## 4) ERC‑721 (NFT)

### 4.1 Opción A: OpenZeppelin Wizard
1. En https://wizard.openzeppelin.com/ elige "ERC721".
2. Configura:
   - Name: "CursoNFT" — Symbol: "CNFT".
   - Marcas: Mintable, Auto Increment Id, URI Storage (útil para tokenURI), Pausable (opcional).
3. Copia el código a Remix (archivo `contracts/CursoNFT.sol`). Compila.

### 4.2 Opción B: archivo manual con imports por URL
Crea `contracts/CursoNFT.sol` en Remix y pega:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";

contract CursoNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("CursoNFT", "CNFT") Ownable(msg.sender) {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // Overrides requeridos por Solidity para URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

Notas:
- `tokenURI` debe apuntar a un JSON con metadatos estándar ERC‑721, por ejemplo alojado en IPFS/HTTP:
  ```json
  {
    "name": "Mi primer NFT",
    "description": "NFT de prueba",
    "image": "ipfs://<CID-de-la-imagen>",
    "attributes": [{"trait_type":"Raro","value":"Sí"}]
  }
  ```

### 4.3 Despliegue del ERC‑721
1. Compila `CursoNFT.sol`.
2. Deploy con `Injected Provider - MetaMask` en Sepolia.
3. Después del despliegue, prueba `safeMint(tu_direccion, "https://.../metadata.json")`.
4. Verifica `ownerOf(tokenId)` (el primer `tokenId` es 0) y `tokenURI(0)`.

### 4.4 Visualización del NFT
- Muchas plataformas leen `tokenURI`. Puedes usar visores de NFT compatibles con Sepolia o verificar manualmente el JSON.
- Si usas IPFS, asegúrate de que el gateway esté accesible (p. ej., `https://ipfs.io/ipfs/<CID>` o tu gateway preferido).

### 4.5 Verificar en Etherscan
- Igual que con el ERC‑20 (plugin de Remix o vía web). Si usas múltiples archivos/imports, considera Standard JSON Input para verificación.

---

## 5) Consejos y problemas comunes
- Versión de compilador: debe coincidir EXACTAMENTE al verificar en Etherscan.
- Optimizer: si lo activaste al compilar, debes declararlo al verificar.
- `initialSupply` en ERC‑20: usa 18 decimales por convención; en Remix puedes pasar `1000000e18`.
- Allowance/approve: recuerda que `transferFrom` requiere que el `spender` tenga `approve` suficiente del `owner`.
- URIs de NFT: prueba el enlace del JSON en el navegador antes de mintear; evita CORS y enlaces rotos.
- Pausable/Ownable: si pausas, recuerda despausar; si cambias el `owner`, guarda la nueva dirección.
- MetaMask: si no aparece el token ERC‑20, impórtalo manualmente con la dirección del contrato.

---

## 6) Checklist rápido
- [ ] Compilé con 0.8.20+ sin warnings críticos
- [ ] Activé optimizer (200)
- [ ] Deploy en Sepolia con `Injected Provider`
- [ ] Probé `transfer`, `approve`, `transferFrom` (ERC‑20)
- [ ] Minteé 1 NFT y confirmé `ownerOf` y `tokenURI` (ERC‑721)
- [ ] Verifiqué el/los contratos en Etherscan
- [ ] Agregué mi ERC‑20 a MetaMask

---

## 7) Recursos útiles
- OpenZeppelin Wizard: https://wizard.openzeppelin.com/
- OpenZeppelin ERC20: https://docs.openzeppelin.com/contracts/5.x/erc20
- OpenZeppelin ERC721: https://docs.openzeppelin.com/contracts/5.x/erc721
- Remix — Deploy & Run: https://remix-ide.readthedocs.io/en/latest/run.html
- Etherscan — Verificación: https://docs.etherscan.io/tutorials/verifying-contracts
- MetaMask — Agregar token personalizado: https://support.metamask.io/hc/en-us/articles/360015489471-How-to-add-a-custom-token-in-MetaMask
