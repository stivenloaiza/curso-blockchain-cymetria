import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(40%_60%_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(35%_55%_at_80%_20%,rgba(6,182,212,0.18),transparent_60%),radial-gradient(50%_50%_at_50%_90%,rgba(99,102,241,0.15),transparent_60%)]">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] mix-blend-overlay" />

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-10 px-6 pb-24 pt-28 text-center sm:pt-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/10">
          <span>🪙</span>
          <span>Ethereum · Wallet de práctica</span>
        </div>

        <h1 className="text-balance bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl">
          My Own Wallet
        </h1>
        <p className="text-pretty max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
          Una wallet simple de Ethereum para aprender: crea una cuenta simple con una sola clave o una HD&nbsp;Wallet con múltiples direcciones derivadas.
        </p>

        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/simple-account"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-base font-medium text-emerald-950 shadow-lg transition hover:translate-y-[-1px] hover:bg-emerald-400 hover:shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:text-lg"
            >
              <span>Crear cuenta simple ETH</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/hd-wallet"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-white/0 px-5 py-4 text-base font-medium text-cyan-200 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:text-lg"
            >
              <span>Crear HD Wallet ETH</span>
              <span className="transition-transform group-hover:translate-x-0.5">⚡</span>
            </Link>
          </div>

          <p className="mt-4 text-xs text-white/60">
            Sugerencia: puedes comenzar con una cuenta simple y luego migrar a HD para múltiples direcciones.
          </p>
        </div>

        <footer className="mt-4 text-xs text-white/50">
          Hecho con Next.js y Tailwind · Modo oscuro automático · Por Stiven Loaiza para el curso de Blockchain 2025.
        </footer>
      </main>
    </div>
  );
}
