"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  createConnection,
  sendSolTransaction,
  waitForTxConfirmation,
  getExplorerTxUrl,
} from "../../lib/tx/solana";
import {
  createSimpleWallet,
  addressFromPrivateKey,
  isValidPrivateKey,
} from "../../lib/wallet/simple";

// Presets de red (editable por el usuario)
// Para Solana usamos clusters: devnet, testnet, mainnet-beta
const NETWORK_PRESETS = [
  {
    key: "mainnet-beta",
    name: "Solana Mainnet",
    cluster: "mainnet-beta" as const,
    defaultRpc: "https://api.mainnet-beta.solana.com",
    explorer: "https://explorer.solana.com",
  },
  {
    key: "testnet",
    name: "Solana Testnet",
    cluster: "testnet" as const,
    defaultRpc: "https://api.testnet.solana.com",
    explorer: "https://explorer.solana.com",
  },
  {
    key: "devnet",
    name: "Solana Devnet (recomendado)",
    cluster: "devnet" as const,
    defaultRpc: "https://api.devnet.solana.com",
    explorer: "https://explorer.solana.com",
  },
] as const;

type PresetKey = typeof NETWORK_PRESETS[number]["key"];

type NetInfo = { cluster: "devnet" | "testnet" | "mainnet-beta"; slot?: number } | null;

export default function TransactionsPage() {
  // Red y conexión
  const [preset, setPreset] = useState<PresetKey>("devnet");
  const [rpcUrl, setRpcUrl] = useState(
    NETWORK_PRESETS.find((p) => p.key === "devnet")!.defaultRpc
  );
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [netInfo, setNetInfo] = useState<NetInfo>(null);
  const [connError, setConnError] = useState<string | null>(null);

  const selectedPreset = useMemo(() => NETWORK_PRESETS.find((x) => x.key === preset)!, [preset]);
  const explorerBase = selectedPreset.explorer;

  // Wallet simple (creación/importación)
  const [address, setAddress] = useState(""); // PublicKey base58
  const [privateKey, setPrivateKey] = useState(""); // SecretKey base58 (64 bytes)
  const [showPk, setShowPk] = useState(false);
  const [copy, setCopy] = useState<null | "address" | "pk">(null);

  // Saldo y estados
  const [balanceSol, setBalanceSol] = useState<string>("0");
  const [loadingBal, setLoadingBal] = useState(false);
  const [balError, setBalError] = useState<string | null>(null);

  // Envío de transacciones
  const [to, setTo] = useState(""); // PublicKey destino (base58)
  const [amount, setAmount] = useState(""); // SOL en unidades humanas
  const [sending, setSending] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  // Estados relacionados con confirmación (educativo)
  const [confirming, setConfirming] = useState(false);
  const [txConfirmed, setTxConfirmed] = useState<boolean | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Copiar al clipboard
  const copyToClipboard = async (text: string, field: "address" | "pk") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopy(field);
      setTimeout(() => setCopy(null), 1500);
    } catch (_) {}
  };

  // Cuando cambia el preset, actualizar RPC por defecto.
  useEffect(() => {
    const p = NETWORK_PRESETS.find((x) => x.key === preset)!;
    setRpcUrl(p.defaultRpc);
  }, [preset]);

  // Conectar Connection
  const handleConnect = async () => {
    setConnecting(true);
    setConnError(null);
    setNetInfo(null);
    setConnection(null);
    try {
      const conn = createConnection(rpcUrl);
      setConnection(conn);
      // Sondas rápidas para salud del RPC
      const slot = await conn.getSlot();
      setNetInfo({ cluster: selectedPreset.cluster, slot });
    } catch (err: any) {
      const raw = err?.message || String(err);
      const hint = raw?.toLowerCase().includes("fetch")
        ? "El RPC no respondió (CORS o red). Prueba con otro endpoint público."
        : "No se pudo conectar al RPC";
      setConnError(`${hint}${raw ? ` · Detalle: ${raw}` : ""}`);
    } finally {
      setConnecting(false);
    }
  };

  // Crear wallet simple
  const handleCreateWallet = () => {
    const w = createSimpleWallet();
    setAddress(w.address);
    setPrivateKey(w.privateKey);
    setSignature(null);
  };

  // Importar: al salir del input de secretKey, si es válida, derivar publicKey
  const handlePkBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    const sk = e.currentTarget.value.trim();
    if (!sk) return;
    if (!isValidPrivateKey(sk)) {
      alert("La clave secreta no es válida. Debe ser base58 (64 bytes).");
      return;
    }
    try {
      const pub = addressFromPrivateKey(sk);
      setAddress(pub);
    } catch {}
  };

  // Cargar saldo cuando haya connection + address
  const refreshBalance = async () => {
    if (!connection || !address) return;
    setLoadingBal(true);
    setBalError(null);
    try {
      const lamports = await connection.getBalance(new PublicKey(address));
      const sol = lamports / LAMPORTS_PER_SOL;
      setBalanceSol(sol.toString());
    } catch (err: any) {
      setBalError(err?.message ?? "No fue posible obtener el saldo.");
    } finally {
      setLoadingBal(false);
    }
  };

  useEffect(() => {
    setBalanceSol("0");
    if (connection && address) {
      refreshBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, address]);

  // Enviar transacción nativa SOL usando la lógica separada
  const handleSend = async () => {
    setTxError(null);
    setSignature(null);
    setTxConfirmed(null);
    setConfirmError(null);

    if (!connection) {
      setTxError("Conéctate primero a un RPC de Solana");
      return;
    }
    if (!privateKey || !isValidPrivateKey(privateKey)) {
      setTxError("Debes tener una wallet válida (secret key base58 de 64 bytes).");
      return;
    }
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setTxError("Ingresa un monto válido en SOL.");
      return;
    }

    try {
      setSending(true);
      const { signature } = await sendSolTransaction({
        connection,
        secretKeyBase58: privateKey,
        to,
        amountSol: amount,
      });
      setSignature(signature);
      // Tras enviar y confirmar (sendAndConfirmTransaction), refrescamos saldo
      await refreshBalance();
    } catch (err: any) {
      setTxError(err?.message ?? "Error al enviar la transacción.");
    } finally {
      setSending(false);
    }
  };

  // Verificar si la transacción ya fue confirmada (útil si cambiamos el commitment)
  const handleCheckConfirmation = async () => {
    if (!connection || !signature) return;
    setConfirmError(null);
    setConfirming(true);
    try {
      const { confirmed } = await waitForTxConfirmation({
        connection,
        signature,
        commitment: "confirmed",
        timeoutMs: 60000,
      });
      setTxConfirmed(confirmed);
      if (confirmed) await refreshBalance();
    } catch (err: any) {
      setConfirmError(err?.message ?? "No fue posible verificar la confirmación.");
    } finally {
      setConfirming(false);
    }
  };

  // Utilidad: construir link al explorador de Solana
  const renderTxLink = (sig: string) => {
    const url = getExplorerTxUrl(explorerBase, sig, selectedPreset.cluster);
    if (!url) return sig;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-emerald-200 underline underline-offset-2 hover:text-emerald-100"
      >
        {sig.slice(0, 10)}…
      </a>
    );
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(40%_60%_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(35%_55%_at_80%_20%,rgba(6,182,212,0.18),transparent_60%),radial-gradient(50%_50%_at_50%_90%,rgba(99,102,241,0.15),transparent_60%)]">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] mix-blend-overlay" />

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 pb-24 pt-24 text-center sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/10">
          <span>🧾</span>
          <span>Transacciones · Solana</span>
        </div>

        <h1 className="text-balance bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-3xl font-semibold leading-tight text-transparent sm:text-4xl">
          Enviar y recibir · Saldo · Wallet simple
        </h1>
        <p className="text-pretty max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Esta sección es educativa. No uses claves reales. Para pruebas usa Devnet.
        </p>

        <div className="mx-auto w-full max-w-2xl space-y-8">
          {/* Card: Red de conexión */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">1) Red de conexión</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Preset</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as PresetKey)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 outline-none transition focus:ring-2 focus:ring-emerald-300/50"
                >
                  {NETWORK_PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">RPC URL (editable)</label>
                <input
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-emerald-300/50"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-white/70">
                {connecting && <span>Conectando…</span>}
                {!connecting && netInfo?.cluster && (
                  <span>
                    Conectado a <span className="font-mono">{netInfo.cluster}</span>
                    {netInfo?.slot ? ` · slot ${netInfo.slot}` : ""}
                  </span>
                )}
                {!connecting && !netInfo?.cluster && <span>No conectado</span>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg transition hover:translate-y-[-1px] hover:bg-emerald-400 hover:shadow-emerald-500/30 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  {connecting ? "Conectando…" : "Aplicar / Conectar"}
                </button>
                <button
                  onClick={() => {
                    setConnection(null);
                    setNetInfo(null);
                    setConnError(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/0 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Desconectar
                </button>
              </div>
            </div>
            {connError && (
              <p className="mt-3 text-sm text-red-300">{connError}</p>
            )}
          </section>

          {/* Card: Wallet simple */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">2) Wallet simple</h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleCreateWallet}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg transition hover:translate-y-[-1px] hover:bg-emerald-400 hover:shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                Crear wallet simple
              </button>
              <Link
                href="/simple-account"
                className="text-xs text-cyan-200 underline underline-offset-2 transition hover:text-cyan-100"
              >
                Ir a vista dedicada de cuenta simple →
              </Link>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Dirección (PublicKey base58)</label>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-emerald-300/50"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: 9xQeW..."
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    onClick={() => copyToClipboard(address, "address")}
                    className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    {copy === "address" ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-white/80">Secret Key (base58)</label>
                  <button
                    onClick={() => setShowPk((v) => !v)}
                    className="text-xs text-cyan-200 underline underline-offset-2 transition hover:text-cyan-100"
                  >
                    {showPk ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-cyan-300/50"
                    type={showPk ? "text" : "password"}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    onBlur={handlePkBlur}
                    placeholder="Base58 (64 bytes)"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    onClick={() => copyToClipboard(privateKey, "pk")}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    {copy === "pk" ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  No compartas esta clave. Usa únicamente Devnet para prácticas.
                </p>
              </div>
            </div>
          </section>

          {/* Card: Saldo y Recibir */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">3) Saldo y recibir</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-white/80">Saldo actual (SOL)</label>
                  <button
                    onClick={refreshBalance}
                    disabled={!connection || !address || loadingBal}
                    className="text-xs text-emerald-200 underline underline-offset-2 disabled:opacity-60 hover:text-emerald-100"
                  >
                    {loadingBal ? "Actualizando…" : "Refrescar"}
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/0 px-4 py-3 text-white/90">
                  {balError ? (
                    <span className="text-red-300">{balError}</span>
                  ) : (
                    <span className="font-mono">{balanceSol}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Tu dirección para recibir</label>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/0 px-4 py-3 text-white/90"
                    value={address}
                    readOnly
                    placeholder="Ej: 9xQeW..."
                  />
                  <button
                    onClick={() => copyToClipboard(address, "address")}
                    className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    Copiar
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Comparte esta dirección para recibir fondos (usa Devnet para pruebas).
                </p>
              </div>
            </div>
          </section>

          {/* Card: Enviar */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">4) Enviar</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Para (PublicKey base58)</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Ej: H3v9..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-indigo-300/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Monto (SOL)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-indigo-300/50"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-white/70">
                Envía desde tu wallet simple conectada a la red seleccionada.
              </div>
              <button
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-indigo-950 shadow-lg transition hover:translate-y-[-1px] hover:bg-indigo-400 hover:shadow-indigo-500/30 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                {sending ? "Enviando…" : "Enviar transacción"}
              </button>
            </div>
            {txError && <p className="mt-3 text-sm text-red-300">{txError}</p>}
            {signature && (
              <div className="mt-4 space-y-2">
                {/* Mostramos el identificador de transacción (signature) */}
                <div className="text-sm text-white/80">
                  <span className="text-white/70">Signature:</span> <span className="font-mono">{renderTxLink(signature)}</span>
                </div>
                {/* Acciones: verificar confirmación y abrir en el explorador */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCheckConfirmation}
                    disabled={confirming}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/0 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {confirming ? "Verificando…" : "Verificar confirmación"}
                  </button>
                  {getExplorerTxUrl(explorerBase, signature, selectedPreset.cluster) && (
                    <a
                      href={getExplorerTxUrl(explorerBase, signature, selectedPreset.cluster)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 shadow-lg transition hover:translate-y-[-1px] hover:bg-emerald-400 hover:shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    >
                      Ver en Explorer
                    </a>
                  )}
                </div>
                {/* Estado de confirmación */}
                {txConfirmed !== null && (
                  txConfirmed ? (
                    <p className="text-sm text-emerald-300">Confirmada ✅</p>
                  ) : (
                    <p className="text-sm text-yellow-300">Aún sin confirmar ⏳. Intenta nuevamente en unos segundos.</p>
                  )
                )}
                {confirmError && (
                  <p className="text-sm text-red-300">{confirmError}</p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="mt-2 inline-flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/0 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            ← Volver al inicio
          </Link>
        </div>

        <footer className="mt-1 text-xs text-white/50">
          Vista de transacciones · Por Stiven Loaiza para el curso de Blockchain 2025.
        </footer>
      </main>
    </div>
  );
}
