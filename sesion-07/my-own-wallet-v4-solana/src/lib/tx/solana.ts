// Funciones auxiliares para enviar y confirmar transacciones en Solana (@solana/web3.js)
// -------------------------------------------------------------------------------------
// Este módulo concentra la lógica de negocio para trabajar con la red de Solana
// desde el navegador: crear una conexión (Connection), consultar balances y
// enviar una transferencia nativa de SOL.
//
// Advertencia de seguridad:
// - Este código es educativo. No utilices claves con fondos reales. Prefiere devnet.

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Commitment,
} from "@solana/web3.js";
import bs58 from "bs58";

export type CreateConnectionResult = Connection;

export function createConnection(rpcUrl: string): CreateConnectionResult {
  // Commitment por defecto "confirmed" para lecturas rápidas en UI
  return new Connection(rpcUrl, { commitment: "confirmed" });
}

export type SendSolTxParams = {
  connection: Connection; // Conexión a la red seleccionada
  secretKeyBase58: string; // Clave secreta en base58 (64 bytes codificados)
  to: string; // PublicKey destino (base58)
  amountSol: string; // Monto en SOL en formato humano (string)
};

export type SendSolTxResult = {
  signature: string; // Identificador de la transacción en Solana
};

export async function sendSolTransaction(params: SendSolTxParams): Promise<SendSolTxResult> {
  const { connection, secretKeyBase58, to, amountSol } = params;

  // Validaciones básicas
  let fromKp: Keypair;
  try {
    const sk = bs58.decode(secretKeyBase58.trim());
    if (sk.length !== 64) throw new Error("La clave secreta debe ser 64 bytes en base58.");
    fromKp = Keypair.fromSecretKey(Uint8Array.from(sk));
  } catch (e: any) {
    throw new Error(e?.message || "Clave secreta inválida (se espera base58 de 64 bytes).");
  }

  let toPk: PublicKey;
  try {
    toPk = new PublicKey(to.trim());
  } catch {
    throw new Error("La dirección destino no es una PublicKey válida (base58).");
  }

  const n = Number(amountSol);
  if (!amountSol || isNaN(n) || n <= 0) {
    throw new Error("El monto debe ser un número positivo en SOL.");
  }

  const lamports = BigInt(Math.floor(n * LAMPORTS_PER_SOL));

  // Construimos una transferencia nativa SOL
  const ix = SystemProgram.transfer({
    fromPubkey: fromKp.publicKey,
    toPubkey: toPk,
    lamports: Number(lamports),
  });
  const tx = new Transaction().add(ix);

  // Enviamos y confirmamos de forma conveniente (bloquea hasta confirmación segun commitment)
  const signature = await sendAndConfirmTransaction(connection, tx, [fromKp], {
    commitment: "confirmed",
  });

  return { signature };
}

export type WaitTxParams = {
  connection: Connection;
  signature: string;
  commitment?: Commitment; // "processed" | "confirmed" | "finalized"
  timeoutMs?: number;
};

export type WaitTxResult = {
  confirmed: boolean;
};

export async function waitForTxConfirmation(params: WaitTxParams): Promise<WaitTxResult> {
  const { connection, signature, commitment = "confirmed", timeoutMs = 60000 } = params;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await connection.confirmTransaction({ signature }, commitment);
    clearTimeout(timer);
    return { confirmed: !!res?.value }; // si value está presente, asumimos confirmación
  } catch (e) {
    clearTimeout(timer);
    return { confirmed: false };
  }
}

// Construye la URL del explorador de Solana para una transacción dada
export function getExplorerTxUrl(explorerBase: string | undefined, signature: string, cluster?: "devnet" | "testnet" | "mainnet-beta"): string | null {
  if (!explorerBase) return null;
  const suffix = cluster && cluster !== "mainnet-beta" ? `?cluster=${cluster}` : "";
  return `${explorerBase}/tx/${signature}${suffix}`;
}
