"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import {
  createProvider,
  sendEthTransaction,
  waitForTxConfirmation,
  getExplorerTxUrl,
} from "../../lib/tx/eth";
import {
  createSimpleWallet,
  addressFromPrivateKey,
  isValidPrivateKey,
} from "../../lib/wallet/simple";

// Presets de red (editable por el usuario)
// Nota: algunos RPC públicos bloquean peticiones desde el navegador por CORS.
// Usamos endpoints de PublicNode que suelen permitir CORS sin API key.
const NETWORK_PRESETS = [
  {
    key: "mainnet",
    name: "Ethereum Mainnet",
    chainId: 1,
    defaultRpc: "https://ethereum.publicnode.com",
    explorer: "https://etherscan.io",
  },
  {
    key: "sepolia",
    name: "Sepolia Testnet",
    chainId: 11155111,
    defaultRpc: "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
  },
] as const;

type PresetKey = typeof NETWORK_PRESETS[number]["key"];

export default function TransactionsPage() {
  // Red y provider
  const [preset, setPreset] = useState<PresetKey>("sepolia");
  const [rpcUrl, setRpcUrl] = useState(
    NETWORK_PRESETS.find((p) => p.key === "sepolia")!.defaultRpc
  );
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
  const [netInfo, setNetInfo] = useState<{ name?: string; chainId?: number } | null>(null);
  const [connError, setConnError] = useState<string | null>(null);

  const explorerBase = useMemo(() => {
    const p = NETWORK_PRESETS.find((x) => x.key === preset);
    return p?.explorer;
  }, [preset]);

  // Wallet simple (creación/importación)
  const [address, setAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPk, setShowPk] = useState(false);
  const [copy, setCopy] = useState<null | "address" | "pk">(null);

  // Saldo y estados
  const [balanceEth, setBalanceEth] = useState<string>("0");
  const [loadingBal, setLoadingBal] = useState(false);
  const [balError, setBalError] = useState<string | null>(null);

  // Envío de transacciones
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  // Estados relacionados con confirmación de la transacción (educativo)
  const [confirming, setConfirming] = useState(false);
  const [txConfirmed, setTxConfirmed] = useState<boolean | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [receiptBlock, setReceiptBlock] = useState<number | null>(null);

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

  // Conectar provider
  const handleConnect = async () => {
    // Conectar a la red elegida a través del RPC indicado.
    // Usamos la función de lib para mantener esta vista ligera y pedagógica.
    setConnecting(true);
    setConnError(null);
    setNetInfo(null);
    setProvider(null);
    try {
      const prov = createProvider(rpcUrl);
      // Asignamos el provider temprano para permitir reintentos y refrescos manuales
      setProvider(prov);

      // Sonda rápida: pedimos la red y un número de bloque para comprobar salud del RPC
      const net = await prov.getNetwork();
      await prov.getBlockNumber();

      setNetInfo({ name: String(net.name), chainId: Number(net.chainId) });
    } catch (err: any) {
      const raw = err?.message || String(err);
      const hint =
        raw?.toLowerCase().includes("fetch") || raw?.toLowerCase().includes("cors")
          ? "El RPC bloqueó la petición del navegador (CORS) o la URL no responde. Prueba con otro endpoint público o usa una API key (Infura/Alchemy)."
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
    setTxHash(null);
  };

  // Importar: al salir del input de PK, si es válida, derivar address
  const handlePkBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    const pk = e.currentTarget.value.trim();
    if (!pk) return;
    if (!isValidPrivateKey(pk)) {
      alert("La clave privada no es válida. Debe ser hex (32 bytes) con o sin 0x.");
      return;
    }
    try {
      const addr = addressFromPrivateKey(pk);
      setAddress(addr);
    } catch {}
  };

  // Cargar saldo cuando haya provider + address
  const refreshBalance = async () => {
    if (!provider || !address) return;
    setLoadingBal(true);
    setBalError(null);
    try {
      const bal = await provider.getBalance(address);
      setBalanceEth(formatEther(bal));
    } catch (err: any) {
      setBalError(err?.message ?? "No fue posible obtener el saldo.");
    } finally {
      setLoadingBal(false);
    }
  };

  useEffect(() => {
    setBalanceEth("0");
    if (provider && address) {
      refreshBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, address]);

  // Enviar transacción usando la lógica separada en lib/tx/eth
  const handleSend = async () => {
    // Limpiamos errores previos y estados de confirmación
    setTxError(null);
    setTxHash(null);
    setTxConfirmed(null);
    setConfirmError(null);
    setReceiptBlock(null);

    if (!provider) {
      setTxError("Conéctate primero a una red (RPC)");
      return;
    }
    if (!privateKey || !isValidPrivateKey(privateKey)) {
      setTxError("Debes tener una wallet válida (clave privada válida).");
      return;
    }
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setTxError("Ingresa un monto válido en ETH.");
      return;
    }

    try {
      setSending(true);
      const { txHash } = await sendEthTransaction({
        provider,
        privateKey,
        to,
        amountEth: amount,
      });
      setTxHash(txHash);
      // Nota: No esperamos confirmaciones aquí para no bloquear la UI.
      // Ofrecemos un botón para verificar confirmación cuando el usuario lo desee.
    } catch (err: any) {
      // ethers puede anidar mensajes en info.error.message
      setTxError(err?.info?.error?.message ?? err?.message ?? "Error al enviar la transacción.");
    } finally {
      setSending(false);
    }
  };

  // Verificar si la transacción ya fue confirmada en la red
  const handleCheckConfirmation = async () => {
    if (!provider || !txHash) return;
    setConfirmError(null);
    setConfirming(true);
    try {
      const { confirmed, receipt } = await waitForTxConfirmation({
        provider,
        txHash,
        confirmations: 1, // educativo: 1 confirmación suele ser suficiente en testnet
        timeoutMs: 60000, // 60s de espera para evitar bloquear indefinidamente
      });
      setTxConfirmed(confirmed);
      setReceiptBlock(receipt?.blockNumber ?? null);
      // Si se confirma, refrescamos el saldo por conveniencia
      if (confirmed) {
        await refreshBalance();
      }
    } catch (err: any) {
      setConfirmError(err?.message ?? "No fue posible verificar la confirmación.");
    } finally {
      setConfirming(false);
    }
  };

  // Utilidad: construir link al explorador (Etherscan/SepoliaScan) usando lib
  const renderTxLink = (hash: string) => {
    const url = getExplorerTxUrl(explorerBase, hash);
    if (!url) return hash;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-emerald-200 underline underline-offset-2 hover:text-emerald-100"
      >
        {hash.slice(0, 10)}…
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
          <span>Transacciones · Ethereum</span>
        </div>

        <h1 className="text-balance bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-3xl font-semibold leading-tight text-transparent sm:text-4xl">
          Enviar y recibir · Saldo · Wallet simple
        </h1>
        <p className="text-pretty max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Esta sección es sólo educativa. No uses claves privadas reales. Prueba preferiblemente en Sepolia.
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
                {!connecting && netInfo?.chainId && (
                  <span>
                    Conectado a chainId <span className="font-mono">{netInfo.chainId}</span>
                    {" "}
                    {netInfo?.name ? `(${netInfo.name})` : ""}
                  </span>
                )}
                {!connecting && !netInfo?.chainId && <span>No conectado</span>}
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
                    setProvider(null);
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
                <label className="mb-2 block text-sm font-medium text-white/80">Address</label>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-emerald-300/50"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x…"
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
                  <label className="block text-sm font-medium text-white/80">Private Key</label>
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
                    placeholder="0x…"
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
                  No compartas esta clave. Usa únicamente testnets en prácticas.
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
                  <label className="block text-sm font-medium text-white/80">Saldo actual (ETH)</label>
                  <button
                    onClick={refreshBalance}
                    disabled={!provider || !address || loadingBal}
                    className="text-xs text-emerald-200 underline underline-offset-2 disabled:opacity-60 hover:text-emerald-100"
                  >
                    {loadingBal ? "Actualizando…" : "Refrescar"}
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/0 px-4 py-3 text-white/90">
                  {balError ? (
                    <span className="text-red-300">{balError}</span>
                  ) : (
                    <span className="font-mono">{balanceEth}</span>
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
                    placeholder="0x…"
                  />
                  <button
                    onClick={() => copyToClipboard(address, "address")}
                    className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    Copiar
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Comparte esta dirección para recibir fondos (usa Sepolia para pruebas).
                </p>
              </div>
            </div>
          </section>

          {/* Card: Enviar */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">4) Enviar</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Para (address)</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-indigo-300/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Monto (ETH)</label>
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
            {txHash && (
              <div className="mt-4 space-y-2">
                {/* Mostramos el identificador de transacción (txID/txHash) */}
                <div className="text-sm text-white/80">
                  <span className="text-white/70">TX ID:</span> <span className="font-mono">{renderTxLink(txHash)}</span>
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
                  {getExplorerTxUrl(explorerBase, txHash) && (
                    <a
                      href={getExplorerTxUrl(explorerBase, txHash)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 shadow-lg transition hover:translate-y-[-1px] hover:bg-emerald-400 hover:shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    >
                      Ver en Etherscan
                    </a>
                  )}
                </div>
                {/* Estado de confirmación */}
                {txConfirmed !== null && (
                  txConfirmed ? (
                    <p className="text-sm text-emerald-300">Confirmada ✅ {receiptBlock ? `(bloque #${receiptBlock})` : ""}</p>
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
