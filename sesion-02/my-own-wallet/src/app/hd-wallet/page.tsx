"use client";

import Link from "next/link";
import { useState } from "react";

type AccountRow = {
  address: string;
  privateKey: string;
  showPk: boolean;
};

type CopiedKey = string | null; // e.g. "mnemonic", "address-0", "pk-0"

export default function HDWalletPage() {
  const [mnemonic, setMnemonic] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [accounts, setAccounts] = useState<AccountRow[]>([
    { address: "", privateKey: "", showPk: false },
  ]);
  const [copied, setCopied] = useState<{ key: CopiedKey; ts: number }>({ key: null, ts: 0 });

  const copyToClipboard = async (text: string, key: CopiedKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ key, ts: Date.now() });
      setTimeout(() => setCopied({ key: null, ts: 0 }), 1500);
    } catch (_) {
      // noop
    }
  };

  const addAccount = () => {
    setAccounts((prev) => [...prev, { address: "", privateKey: "", showPk: false }]);
  };

  const togglePk = (idx: number) => {
    setAccounts((prev) => prev.map((acc, i) => (i === idx ? { ...acc, showPk: !acc.showPk } : acc)));
  };

  const updateAccount = (idx: number, field: keyof AccountRow, value: string | boolean) => {
    setAccounts((prev) => prev.map((acc, i) => (i === idx ? { ...acc, [field]: value } as AccountRow : acc)));
  };

  const clearAll = () => {
    setMnemonic("");
    setShowMnemonic(false);
    setAccounts([{ address: "", privateKey: "", showPk: false }]);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(40%_60%_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(35%_55%_at_80%_20%,rgba(6,182,212,0.18),transparent_60%),radial-gradient(50%_50%_at_50%_90%,rgba(99,102,241,0.15),transparent_60%)]">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] mix-blend-overlay" />

      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 pb-24 pt-24 text-center sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/10">
          <span>🌿</span>
          <span>HD Wallet · Ethereum</span>
        </div>

        <h1 className="text-balance bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-3xl font-semibold leading-tight text-transparent sm:text-4xl">
          Crear HD Wallet ETH
        </h1>
        <p className="text-pretty max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Visualiza una frase semilla (BIP-39) y múltiples cuentas derivadas. <span className="font-semibold text-white">No compartas</span> tu frase ni claves privadas.
        </p>

        <div className="mx-auto w-full max-w-3xl space-y-8 text-left">
          {/* Seed phrase */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-white/80">Frase semilla (BIP-39)</label>
              <button
                onClick={() => setShowMnemonic((v) => !v)}
                className="text-xs text-cyan-200 underline underline-offset-2 transition hover:text-cyan-100"
                aria-pressed={showMnemonic}
              >
                {showMnemonic ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <div className="flex items-start gap-2">
              <textarea
                className={`min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-cyan-300/50 ${
                  showMnemonic ? "blur-0" : "blur-[3px]"
                }`}
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="seed phrase de ejemplo: word1 word2 word3 …"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                onClick={() => copyToClipboard(mnemonic, "mnemonic")}
                className="mt-1 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label="Copiar frase semilla"
              >
                {copied.key === "mnemonic" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="mt-2 text-xs text-white/60">
              Guarda tu frase semilla de forma offline (papel o hardware). Cualquiera con acceso a ella controla tus fondos.
            </p>
          </section>

          {/* Accounts list */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white/90">Cuentas derivadas</h2>
              <button
                onClick={addAccount}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                + Agregar cuenta
              </button>
            </div>

            <div className="space-y-8">
              {accounts.map((acc, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-white/0 p-4 sm:p-5">
                  <div className="mb-3 text-sm text-white/70">Cuenta #{idx + 1} · Ruta sugerida: m/44'/60'/0'/0/{idx}</div>

                  {/* Address */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-white/80">Ethereum Address</label>
                    <div className="flex items-center gap-2">
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-emerald-300/50"
                        value={acc.address}
                        onChange={(e) => updateAccount(idx, "address", e.target.value)}
                        placeholder="0x…"
                        inputMode="text"
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <button
                        onClick={() => copyToClipboard(acc.address, `address-${idx}`)}
                        className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        aria-label={`Copiar address cuenta ${idx + 1}`}
                      >
                        {copied.key === `address-${idx}` ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>

                  {/* Private Key */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-white/80">Private Key</label>
                      <button
                        onClick={() => togglePk(idx)}
                        className="text-xs text-cyan-200 underline underline-offset-2 transition hover:text-cyan-100"
                        aria-pressed={acc.showPk}
                      >
                        {acc.showPk ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-cyan-300/50"
                        type={acc.showPk ? "text" : "password"}
                        value={acc.privateKey}
                        onChange={(e) => updateAccount(idx, "privateKey", e.target.value)}
                        placeholder="Clave privada (0x…)"
                        inputMode="text"
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <button
                        onClick={() => copyToClipboard(acc.privateKey, `pk-${idx}`)}
                        className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        aria-label={`Copiar private key cuenta ${idx + 1}`}
                      >
                        {copied.key === `pk-${idx}` ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-white/60">
                      No compartas tu clave privada. Usa hardware wallets en producción.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-white/60">
              Nota: Esta es una demo educativa. Usa derivación HD con ethers.js + bip39.
            </p>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={clearAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/0 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Limpiar
            </button>

            <div className="inline-flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/0 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-1 text-xs text-white/50">Vista HD Wallet · Por Stiven Loaiza para el curso de Blockchain 2025.</footer>
      </main>
    </div>
  );
}
