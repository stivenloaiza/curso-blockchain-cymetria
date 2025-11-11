"use client";

// Página Web3 (ERC-20) — UI + lógica separada en lib
// ---------------------------------------------------
// Objetivo:
// 1) Consultar el saldo de un token ERC-20 de un address.
// 2) Transferir un token ERC-20 a otro address.
// 3) Mantener el estilo visual de la app (contenedores, tipografía, colores).
// 4) Comentar todo muy bien y mover la lógica Web3 a un módulo en src/lib/web3/erc20.ts
// Nota: La vista usa funciones de la lib (ethers v6) y maneja estados/errores de forma pedagógica.

import Link from "next/link";
import { useState } from "react";
import { readErc20Balance, transferErc20 } from "../../lib/web3/erc20";

export default function Web3Erc20Page() {
  // Estado local para los formularios (UI) y estados de red
  // --------------------------------------------------------
  // Separamos estado de "Consulta de Saldo" y "Transferencia" para claridad didáctica.

  // Consulta de saldo ERC-20
  const [tokenForBalance, setTokenForBalance] = useState("");
  const [addressForBalance, setAddressForBalance] = useState("");
  const [balanceResult, setBalanceResult] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Transferencia ERC-20
  const [tokenForTransfer, setTokenForTransfer] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(""); // Monto en unidades humanas (por ejemplo, USDC con 6 decimales)
  const [transferNote, setTransferNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Handler: consultar saldo real usando la lógica de lib/web3/erc20
  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceError(null);
    setBalanceResult(null);
    setLoadingBalance(true);
    try {
      const res = await readErc20Balance(tokenForBalance.trim(), addressForBalance.trim());
      const sym = res.symbol ? ` ${res.symbol}` : "";
      setBalanceResult(`${res.formatted}${sym} (decimals: ${res.decimals})`);
    } catch (err: any) {
      setBalanceError(err?.message || "No fue posible leer el balance. Verifica el token, la dirección y la red.");
    } finally {
      setLoadingBalance(false);
    }
  };

  // Handler: transferir token real usando la lógica de lib/web3/erc20
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferNote(null);
    setSending(true);
    try {
      const { txHash } = await transferErc20(
        tokenForTransfer.trim(),
        recipient.trim(),
        amount.trim()
      );
      setTransferNote(`Transacción enviada: ${txHash}`);
    } catch (err: any) {
      // Casos comunes: userRejectedRequest, red incorrecta, insuficiente balance
      setTransferNote(`Error: ${err?.message || "No se pudo enviar la transferencia."}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(40%_60%_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(35%_55%_at_80%_20%,rgba(6,182,212,0.18),transparent_60%),radial-gradient(50%_50%_at_50%_90%,rgba(99,102,241,0.15),transparent_60%)]">
      {/* Rejilla sutil del fondo para mantener el look & feel */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] mix-blend-overlay" />

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 pb-24 pt-24 text-center sm:pt-28">
        {/* Badges superiores (consistencia visual) */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/10">
          <span>🪙</span>
          <span>Web3 · ERC-20 (UI demo)</span>
        </div>

        {/* Título y descripción */}
        <div className="space-y-3">
          <h1 className="text-balance bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-3xl font-semibold leading-tight text-transparent sm:text-4xl">
            Web3 (ERC-20) — Consulta y Transferencia
          </h1>
          <p className="text-pretty max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Esta vista presenta, de forma visual, los formularios típicos para interactuar con un token ERC-20.
            Más adelante conectaremos la lógica con ethers.js para consultar <code>balanceOf</code> y enviar
            <code> transfer</code> firmando con una wallet.
          </p>
        </div>

        {/* Contenedor principal con dos secciones */}
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
          {/* Sección 1: Consultar saldo */}
          <section aria-labelledby="balance-section">
            <h2 id="balance-section" className="text-lg font-semibold text-white">
              1) Consultar saldo de un ERC-20
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Introduce el contrato del token y la dirección a consultar. En la integración real se llamará a
              <code className="ml-1">balanceOf(address)</code> con un <em>provider</em> para obtener el saldo.
            </p>

            <form onSubmit={handleCheckBalance} className="mt-4 grid gap-3">
              {/* Dirección del contrato del token ERC-20 */}
              <label className="grid gap-1 text-sm">
                <span className="text-white/80">Token (contrato ERC‑20)</span>
                <input
                  type="text"
                  inputMode="text"
                  placeholder="0xTokenAddress..."
                  value={tokenForBalance}
                  onChange={(e) => setTokenForBalance(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-emerald-300/40 focus:bg-white/10"
                  aria-describedby="token-help"
                />
                <span id="token-help" className="text-xs text-white/50">
                  Debe ser una dirección válida de contrato en la red actual (por ejemplo, Sepolia/Mainnet).
                </span>
              </label>

              {/* Dirección a consultar */}
              <label className="grid gap-1 text-sm">
                <span className="text-white/80">Dirección a consultar</span>
                <input
                  type="text"
                  inputMode="text"
                  placeholder="0xAddress..."
                  value={addressForBalance}
                  onChange={(e) => setAddressForBalance(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-emerald-300/40 focus:bg-white/10"
                />
                <span className="text-xs text-white/50">
                  Dirección EOA o contrato. Se recomienda verificar checksum (EIP-55) en la implementación real.
                </span>
              </label>

              <div className="mt-1 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={loadingBalance}
                  className={`group inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-white/0 px-4 py-2 text-sm font-medium text-emerald-200 shadow-lg shadow-emerald-500/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${loadingBalance ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 hover:bg-emerald-400/10"}`}
                  aria-busy={loadingBalance}
                >
                  <span>{loadingBalance ? "Consultando..." : "Consultar saldo"}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">🔍</span>
                </button>

                {/* Resultado */}
                <div className="text-right text-sm text-white/70">
                  {balanceResult ? balanceResult : "Resultado: —"}
                </div>
              </div>

              {/* Error de lectura (si aplica) */}
              {balanceError && (
                <div className="mt-2 text-sm text-rose-300/90">
                  {balanceError}
                </div>
              )}
            </form>
          </section>

          <div className="my-6 h-px w-full bg-white/10" />

          {/* Sección 2: Transferir token */}
          <section aria-labelledby="transfer-section">
            <h2 id="transfer-section" className="text-lg font-semibold text-white">
              2) Transferir un ERC-20
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Esta UI prepara la información necesaria para transferir tokens. En la lógica real se firmará
              una transacción con la wallet conectada (Signer) llamando a <code>transfer(to, amount)</code>.
            </p>

            <form onSubmit={handleTransfer} className="mt-4 grid gap-3">
              {/* Contrato del token a transferir */}
              <label className="grid gap-1 text-sm">
                <span className="text-white/80">Token (contrato ERC‑20)</span>
                <input
                  type="text"
                  placeholder="0xTokenAddress..."
                  value={tokenForTransfer}
                  onChange={(e) => setTokenForTransfer(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
                />
                <span className="text-xs text-white/50">
                  Asegúrate de estar en la misma red donde vive el contrato del token.
                </span>
              </label>

              {/* Destinatario */}
              <label className="grid gap-1 text-sm">
                <span className="text-white/80">Destinatario (to)</span>
                <input
                  type="text"
                  placeholder="0xRecipient..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
                />
                <span className="text-xs text-white/50">Dirección que recibirá los tokens.</span>
              </label>

              {/* Monto humano (UI) */}
              <label className="grid gap-1 text-sm">
                <span className="text-white/80">Monto</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 1.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
                />
                <span className="text-xs text-white/50">
                  El monto en unidades humanas (ej: 1.5). En el envío real se convierte a unidades mínimas con
                  <code className="ml-1">parseUnits(monto, decimals)</code>.
                </span>
              </label>

              <div className="mt-1 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className={`group inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-white/0 px-4 py-2 text-sm font-medium text-cyan-200 shadow-lg shadow-cyan-500/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${sending ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 hover:bg-cyan-400/10"}`}
                  aria-busy={sending}
                >
                  <span>{sending ? "Enviando..." : "Transferir"}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">➡️</span>
                </button>

                {/* Estado: texto ilustrativo */}
                <div className="text-right text-sm text-white/70">
                  {transferNote ? transferNote : "Estado: —"}
                </div>
              </div>

              {/* Tips didácticos */}
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-white/55">
                <li>
                  Para tokens con <strong>decimales distintos</strong> (6, 8, 18...), primero lee <code>decimals()</code>
                  y usa esa base para convertir el monto con parseo de unidades.
                </li>
                <li>
                  La llamada a <code>transfer</code> requiere firma del usuario (gas). No confundas con <code>balanceOf</code>,
                  que es lectura gratuita.
                </li>
                <li>
                  Si planeas gastar tokens desde un contrato intermediario, usa <code>approve</code> + <code>transferFrom</code>
                  (patrón ERC-20 permitido). Aquí sólo mostramos <code>transfer</code> directo.
                </li>
              </ul>
            </form>
          </section>
        </div>

        {/* Navegación inferior */}
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <span>←</span>
            <span>Volver al inicio</span>
          </Link>
        </div>

        {/* Pie de página (consistente con otras páginas) */}
        <footer className="mt-2 text-xs text-white/50">
          UI lista para conectar con ethers.js · Curso Blockchain 2025.
        </footer>
      </main>
    </div>
  );
}
