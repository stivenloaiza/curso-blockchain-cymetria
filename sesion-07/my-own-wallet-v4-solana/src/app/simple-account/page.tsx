"use client";

// Vista de Cuenta simple (UI) + integración con la lógica separada
// ----------------------------------------------------------------
// - Esta vista sólo maneja estado y eventos de UI.
// - La generación/validación de claves se delega al módulo src/lib/wallet/simple.ts
//   para explicar mejor los conceptos en un curso (separación de lógica y presentación).

import Link from "next/link";
import { useState } from "react";
import { createSimpleWallet, addressFromPrivateKey, isValidPrivateKey } from "../../lib/wallet/simple";

export default function SimpleAccountPage() {
  // Estado local de la vista. En un caso real, podrías manejarlo con algún store seguro
  // o nunca persistir estos datos en el navegador. Aquí es SOLO con fines educativos.
  const [address, setAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPk, setShowPk] = useState(false);
  const [copied, setCopied] = useState<{ field: "address" | "pk" | null; ts: number }>({ field: null, ts: 0 });

  // Copia al portapapeles (sólo para facilitar la demo en clase).
  const copyToClipboard = async (text: string, field: "address" | "pk") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ field, ts: Date.now() });
      setTimeout(() => setCopied({ field: null, ts: 0 }), 1500);
    } catch (_) {
      // Si falla, ignoramos para no romper la experiencia.
    }
  };

  // Limpia la UI. NO borra nada persistente (no hay almacenamiento en este ejemplo).
  const clearAll = () => {
    setAddress("");
    setPrivateKey("");
    setShowPk(false);
  };

  // Genera una cuenta simple aleatoria (Solana) usando el módulo simple.ts
  const handleGenerate = () => {
    const w = createSimpleWallet();
    setAddress(w.address);
    setPrivateKey(w.privateKey);
    setShowPk(false);
  };

  // Cuando el usuario edita la clave privada, al salir del input intentamos
  // calcular la address correspondiente (si la PK es válida).
  const handlePkBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    const pk = e.currentTarget.value.trim();
    if (!pk) return;
    if (!isValidPrivateKey(pk)) {
      // Alerta educativa para explicar el error de formato/longitud.
      alert("La clave secreta no es válida. Debe ser base58 (64 bytes).");
      return;
    }
    try {
      const addr = addressFromPrivateKey(pk);
      setAddress(addr);
    } catch (err) {
      // Si algo raro ocurre, lo dejamos en silencio para no romper la demo.
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(40%_60%_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(35%_55%_at_80%_20%,rgba(6,182,212,0.18),transparent_60%),radial-gradient(50%_50%_at_50%_90%,rgba(99,102,241,0.15),transparent_60%)]">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] mix-blend-overlay" />

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 pb-24 pt-24 text-center sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/10">
          <span>🔑</span>
          <span>Cuenta simple · Solana</span>
        </div>

        <h1 className="text-balance bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-3xl font-semibold leading-tight text-transparent sm:text-4xl">
          Crear cuenta simple SOL
        </h1>
        <p className="text-pretty max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Aquí tendrás un espacio para visualizar la dirección y la clave privada de una cuenta simple. Mantén tus claves seguras y <span className="font-semibold text-white">nunca</span> las compartas.
        </p>

        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
          <div className="space-y-6">
            {/* Acción principal: generar con lógica separada */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg transition hover:translate-y-[-1px] hover:bg-emerald-400 hover:shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                Generar cuenta aleatoria
              </button>
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Dirección (PublicKey base58)</label>
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder-white/40 outline-none transition focus:ring-2 focus:ring-emerald-300/50"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: 9xQeW..."
                  inputMode="text"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  onClick={() => copyToClipboard(address, "address")}
                  className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  aria-label="Copiar address"
                >
                  {copied.field === "address" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Secret Key */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-white/80">Secret Key (base58)</label>
                <button
                  onClick={() => setShowPk((v) => !v)}
                  className="text-xs text-cyan-200 underline underline-offset-2 transition hover:text-cyan-100"
                  aria-pressed={showPk}
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
                  inputMode="text"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  onClick={() => copyToClipboard(privateKey, "pk")}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  aria-label="Copiar secret key"
                >
                  {copied.field === "pk" ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/60">
                No compartas tu clave privada. Para producción usa almacenamiento seguro y hardware wallets.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
        </div>

        <footer className="mt-1 text-xs text-white/50">
          Vista de cuenta simple · Por Stiven Loaiza para el curso de Blockchain 2025.
        </footer>
      </main>
    </div>
  );
}
