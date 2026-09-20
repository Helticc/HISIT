import type { GameState } from "../game/state";

export default function Lobby({
  game,
  isGuest,
  hostActive,
  code,
  connected,
  onGoSolo,
  onHostOnline,
  onContinue,
}: {
  game: GameState;
  isGuest: boolean;
  /** true once the host has clicked "Play online" and a code exists */
  hostActive: boolean;
  code: string | null;
  connected: boolean;
  onGoSolo(): void;
  onHostOnline(): void;
  onContinue(): void;
}) {
  if (isGuest) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl border border-emerald-800 bg-emerald-500/5 p-8 text-center">
        <div className="text-4xl">📱</div>
        <h3 className="text-lg font-bold text-emerald-300">Connected as Captain 2</h3>
        <p className="text-sm text-slate-400">
          You're in room <span className="font-mono font-bold text-white">{code}</span>.
          Your screen will follow the room automatically — just wait for the host to continue.
        </p>
        <p className="animate-pulse text-xs font-semibold text-slate-500">Waiting for host…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {!hostActive ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={onGoSolo}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-xl transition hover:-translate-y-1 hover:border-orange-500 active:scale-95"
          >
            <div className="mb-2 text-2xl">🖥️</div>
            <h3 className="font-bold text-white group-hover:text-orange-300">Same Screen</h3>
            <p className="mt-1 text-sm text-slate-400">
              Both captains take turns on this device — pass it over when it's their turn.
            </p>
          </button>
          <button
            onClick={onHostOnline}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-xl transition hover:-translate-y-1 hover:border-blue-500 active:scale-95"
          >
            <div className="mb-2 text-2xl">📱📱</div>
            <h3 className="font-bold text-white group-hover:text-blue-300">Two Devices</h3>
            <p className="mt-1 text-sm text-slate-400">
              Generates a room code. Captain 2 enters it on their own phone to join peer-to-peer.
            </p>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-12">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">ROOM CODE</p>
            <button
              onClick={() => code && navigator.clipboard?.writeText(code).catch(() => {})}
              className="mt-3 select-all rounded-2xl bg-slate-950/80 px-10 py-5 font-mono text-5xl font-black tracking-[0.4em] text-white shadow-inner transition hover:ring-2 hover:ring-orange-500/50"
              title="Click to copy"
            >
              {code ?? "·····"}
            </button>
          </div>

          {!connected || !game.teamB.captain ? (
            <div className="flex items-center gap-3 rounded-full border border-amber-900/50 bg-amber-500/10 px-6 py-3 text-sm font-bold text-amber-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Waiting for Team Leader B to join...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-900/50 bg-emerald-500/10 px-10 py-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <span className="text-3xl">✅</span>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">LEADER B HAS JOINED</p>
                <p className="text-2xl font-black text-white italic uppercase">{game.teamB.captain}</p>
              </div>
              <button
                onClick={onContinue}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-blue-600 px-10 py-5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
              >
                START THE DRAFT ➔
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
