// Lógica Web3 para interactuar con tokens ERC-20 usando ethers.js v6
// -------------------------------------------------------------------
// Este módulo concentra funciones reutilizables para:
// - Conectar una wallet del navegador (EIP-1193) vía BrowserProvider.
// - Leer el balance de un token ERC-20 (balanceOf + decimals + symbol) y formatearlo.
// - Transferir tokens ERC-20 (transfer) convirtiendo unidades humanas a mínimas.
// - Validaciones básicas y mensajes de error claros en español.
//
// Se diseñó para ser consumido desde componentes cliente ("use client") de Next.js.
// Evita acceder a `window.ethereum` en el toplevel; sólo dentro de funciones.

import {
  BrowserProvider,
  Contract,
  isAddress,
  parseUnits,
  formatUnits,
  type ContractRunner,
} from "ethers";

// ABI mínimo necesario para balance y transfer
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
] as const;

// Tipos de ayuda
export type ConnectResult = {
  provider: BrowserProvider;
  address: string; // cuenta activa en la wallet
  chainId: number;
};

export type ReadBalanceResult = {
  raw: bigint; // saldo en unidades mínimas (wei del token)
  decimals: number; // decimales reportados por el contrato (fallback 18)
  formatted: string; // saldo formateado a unidades humanas
  symbol?: string; // mejor esfuerzo
};

export type TransferResult = {
  txHash: string;
  // Nota: quien consume puede mostrar el hash y/o esperar confirmación
};

// Utilidad: crea un BrowserProvider a partir de la wallet del navegador (MetaMask, Rabby, etc.)
export function getBrowserProvider(): BrowserProvider {
  const eth = (globalThis as any)?.window?.ethereum ?? (typeof window !== "undefined" ? (window as any).ethereum : undefined);
  if (!eth) {
    throw new Error("Wallet no encontrada. Instale o habilite una wallet compatible (MetaMask, Rabby...).");
  }
  return new BrowserProvider(eth);
}

// Conecta la wallet solicitando permisos de cuenta (eth_requestAccounts)
export async function connectWallet(): Promise<ConnectResult> {
  const provider = getBrowserProvider();
  // Solicita al usuario conectar su cuenta (permiso)
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const net = await provider.getNetwork();
  return { provider, address, chainId: Number(net.chainId) };
}

// Construye una instancia de contrato ERC-20 con un runner (provider o signer)
export function getErc20Contract(tokenAddress: string, runner: ContractRunner): Contract {
  if (!isAddress(tokenAddress)) {
    throw new Error("La dirección del token no es válida.");
  }
  return new Contract(tokenAddress, ERC20_ABI, runner);
}

// Lee el saldo ERC-20 de `holder`. Hace mejor esfuerzo por leer decimals/symbol para formatear.
export async function readErc20Balance(tokenAddress: string, holder: string): Promise<ReadBalanceResult> {
  if (!isAddress(tokenAddress)) throw new Error("La dirección del token no es válida.");
  if (!isAddress(holder)) throw new Error("La dirección a consultar no es válida.");

  const provider = getBrowserProvider(); // sólo lectura, no pide permiso

  // Validación: confirmar que la dirección sea un contrato en la red activa de la wallet
  const code = await provider.getCode(tokenAddress);
  if (!code || code === "0x") {
    throw new Error("La dirección indicada no es un contrato en la red activa de la wallet. Verifica la red y el token.");
  }

  const contract = getErc20Contract(tokenAddress, provider);

  try {
    const [raw, decimals, symbol] = await Promise.all([
      contract.balanceOf(holder) as Promise<bigint>,
      contract.decimals().catch(() => 18),
      contract.symbol().catch(() => undefined),
    ]);

    const formatted = formatUnits(raw, Number(decimals ?? 18));
    return { raw, decimals: Number(decimals ?? 18), formatted, symbol };
  } catch (e: any) {
    if (e?.code === "BAD_DATA") {
      throw new Error("El contrato no respondió como un ERC‑20 válido (balanceOf). Revisa que el token y la red sean correctos.");
    }
    throw e;
  }
}

// Envía una transferencia ERC-20 usando la cuenta activa de la wallet
export async function transferErc20(
  tokenAddress: string,
  to: string,
  amountHuman: string
): Promise<TransferResult> {
  if (!isAddress(tokenAddress)) throw new Error("La dirección del token no es válida.");
  if (!isAddress(to)) throw new Error("La dirección de destino no es válida.");
  const n = Number(amountHuman);
  if (!amountHuman || isNaN(n) || n <= 0) {
    throw new Error("El monto debe ser un número positivo en unidades humanas.");
  }

  const provider = getBrowserProvider();
  // aseguramos tener permiso de cuenta y obtenemos signer
  await provider.send("eth_requestAccounts", []);

  // Validación: confirmar que la dirección sea un contrato en la red activa de la wallet
  const code = await provider.getCode(tokenAddress);
  if (!code || code === "0x") {
    throw new Error("La dirección del token no es un contrato en la red activa de la wallet. Verifica la red y el token.");
  }

  const signer = await provider.getSigner();

  const contract = getErc20Contract(tokenAddress, signer);
  const decimals: number = await contract.decimals().catch(() => 18);
  const amount = parseUnits(amountHuman, decimals);

  const tx = await contract.transfer(to, amount);
  return { txHash: tx.hash };
}
