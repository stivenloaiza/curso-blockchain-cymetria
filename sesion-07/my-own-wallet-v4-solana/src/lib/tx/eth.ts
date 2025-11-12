// Funciones auxiliares para enviar y verificar transacciones en Ethereum (ethers v6)
// ---------------------------------------------------------------------------------
// Este módulo concentra la "lógica de negocio" de transacciones para que la vista
// (componentes React/Next.js) se mantenga limpia y pedagógica. Aquí encontrarás
// funciones pequeñas, bien documentadas en español, que puedes reutilizar en otras
// vistas o proyectos educativos.
//
// Conceptos clave que cubre este módulo:
// - Conexión a un nodo vía JSON-RPC con ethers.js v6.
// - Construcción y envío de una transacción de ETH simple (transferencia de valor).
// - Obtención del identificador de transacción (txHash / txID).
// - Espera de confirmaciones en la red (al menos 1 bloque minado).
// - Construcción de la URL al explorador (Etherscan, Sepolia Etherscan, etc.).
//
// Advertencia de seguridad:
// - Este código es sólo con fines educativos. NO uses claves privadas reales o con
//   fondos en producción. Prefiere testnets (Sepolia) para tus pruebas.

import {
  JsonRpcProvider,
  Wallet,
  isAddress,
  parseEther,
  type TransactionReceipt,
  type TransactionResponse,
} from "ethers";

// Tipos de ayuda para claridad en las firmas
export type SendEthTxParams = {
  provider: JsonRpcProvider; // Provider ya conectado a la red adecuada
  privateKey: string; // Clave privada en hex (con o sin 0x), del emisor
  to: string; // Dirección destino (checksummed o no)
  amountEth: string; // Monto a enviar expresado en ETH como string ("0.001")
};

export type SendEthTxResult = {
  txHash: string; // Identificador de la transacción (txID)
  response: TransactionResponse; // Respuesta completa de ethers por si se quiere inspeccionar
};

export type WaitTxParams = {
  provider: JsonRpcProvider; // Provider conectado a la misma red donde se envió la TX
  txHash: string; // Hash de la transacción a monitorear
  confirmations?: number; // Nº de confirmaciones a esperar (por defecto 1)
  timeoutMs?: number; // Tiempo máximo de espera en milisegundos (opcional)
};

export type WaitTxResult = {
  confirmed: boolean; // true si se obtuvo un recibo dentro del tiempo
  receipt: TransactionReceipt | null; // recibo de la transacción (incluye blockNumber, status, etc.)
};

// Crea un provider JSON-RPC a partir de una URL. No realiza side-effects en UI.
export function createProvider(rpcUrl: string): JsonRpcProvider {
  // ethers v6: JsonRpcProvider es suficiente para la mayoría de casos de lectura/escritura.
  // Si tu RPC requiere cabeceras/autenticación, aquí puedes extenderlo.
  return new JsonRpcProvider(rpcUrl);
}

// Envía una transacción simple de transferencia de ETH.
// - Valida parámetros comunes (formato de address, monto > 0, privateKey con longitud válida).
// - Retorna de inmediato el txHash sin esperar confirmaciones (mismo comportamiento que ethers por defecto).
export async function sendEthTransaction(params: SendEthTxParams): Promise<SendEthTxResult> {
  const { provider, privateKey, to, amountEth } = params;

  // Validaciones básicas y pedagógicas
  if (!privateKey || typeof privateKey !== "string") {
    throw new Error("La clave privada es requerida.");
  }
  if (!isAddress(to)) {
    throw new Error("La dirección de destino no es válida.");
  }
  const amt = Number(amountEth);
  if (!amountEth || isNaN(amt) || amt <= 0) {
    throw new Error("El monto debe ser un número positivo en ETH.");
  }

  // Normaliza la clave privada con prefijo 0x si hace falta
  const normalizedPk = privateKey.trim().startsWith("0x")
    ? privateKey.trim()
    : ("0x" + privateKey.trim());

  // Construye un signer (cartera) a partir de la clave privada y lo conecta al provider
  const wallet = new Wallet(normalizedPk).connect(provider);

  // Arma la transacción simple de valor. Ethers calculará gas y firma por ti.
  const txResponse = await wallet.sendTransaction({
    to,
    value: parseEther(amountEth),
  });

  // txResponse.hash es el txID que puedes mostrar en UI o guardar para seguimiento
  return { txHash: txResponse.hash, response: txResponse };
}

// Espera a que una transacción alcance N confirmaciones (por defecto: 1). Si se provee un
// timeout, la promesa se resuelve con confirmed=false y receipt=null cuando se agota.
// Nota: confirmación = cantidad de bloques minados después del que incluyó la TX, incluyendo ese bloque.
export async function waitForTxConfirmation(params: WaitTxParams): Promise<WaitTxResult> {
  const { provider, txHash, confirmations = 1, timeoutMs } = params;

  // ethers v6: provider.waitForTransaction(hash, confirmations?, timeout?)
  const receipt = await provider.waitForTransaction(txHash, confirmations, timeoutMs);
  if (!receipt) {
    // Si fue null, generalmente indica timeout superado
    return { confirmed: false, receipt: null };
  }
  return { confirmed: true, receipt };
}

// Construye la URL directa al explorador para una transacción dada.
// Ejemplos de base:
// - Mainnet:   https://etherscan.io
// - Sepolia:   https://sepolia.etherscan.io
export function getExplorerTxUrl(explorerBase: string | undefined, txHash: string): string | null {
  if (!explorerBase) return null;
  return `${explorerBase}/tx/${txHash}`;
}
