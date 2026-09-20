import type { ReactNode } from "react";

export default function StageShell({
  title,
  subtitle,
  children,
}: {
  stage: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8">
        <header className="mb-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <img width={"50px"} src={"/faceit.png"}>
            </img>
            <h1 className="text-xl font-black tracking-[0.2em] text-white uppercase italic">
              HISIT
            </h1>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center">
          <div className="w-full max-w-4xl text-center">
            <h2 className="text-2xl font-black text-white sm:text-4xl uppercase tracking-tighter italic drop-shadow-lg">{title}</h2>
            {subtitle && <p className="mt-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">{subtitle}</p>}
          </div>
          <div className="mt-8 w-full">{children}</div>
        </main>

        <footer className="mt-10 pb-4 text-center text-[9px] font-bold tracking-widest text-slate-700 uppercase">
          LAN CS2 ROSTER PICKING
        </footer>
      </div>
    </div>
  );
}
