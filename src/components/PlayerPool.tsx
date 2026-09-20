import { useState } from "react";

export default function PlayerPool({
  players,
  readOnly,
  joinStatus,
  joinError,
  onAdd,
  onRemove,
  onContinue,
  onJoin,
}: {
  players: string[];
  readOnly: boolean;
  joinStatus: "idle" | "connecting" | "connected" | "error";
  joinError: string;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onContinue: () => void;
  onJoin: (code: string) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPoolOpen, setIsPoolOpen] = useState(false);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in the list.`);
      return;
    }
    onAdd(trimmed);
    setName("");
    setError("");
  }

  function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 5) return;
    onJoin(trimmed);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-2 sm:px-0">
      {/* Join an existing room (Captain 2 path) */}
      <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-5 shadow-md">
        <h3 className="mb-2 text-sm font-bold tracking-wide text-white uppercase">
          📱 Join Room
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={5}
            placeholder="ENTER CODE"
            className="flex-1 rounded-lg border border-[#2e2e2e] bg-[#121212] px-4 py-2.5 text-center font-mono text-lg font-bold tracking-[0.3em] text-white placeholder-[#777777] uppercase outline-none focus:border-[#FF5500]"
          />
          <button
            onClick={handleJoin}
            disabled={code.trim().length !== 5 || joinStatus === "connecting"}
            className="rounded-lg bg-[#FF5500] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#ff661a] active:scale-95 disabled:opacity-40"
          >
            {joinStatus === "connecting" ? "Connecting…" : "Join"}
          </button>
        </div>
        {joinStatus === "error" && <p className="mt-2 text-left text-xs text-red-400">{joinError}</p>}
      </div>

      {!readOnly && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setIsPoolOpen(!isPoolOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-[#333333] bg-[#1f1f1f] px-5 py-3 text-sm font-bold text-[#a0a0a0] shadow-md"
          >
            <span className="text-white">PLAYER POOL ({players.length})</span>
            <span className={`transition-transform duration-300 ${isPoolOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {isPoolOpen && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-4 shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="New player..."
                    className="flex-1 rounded-lg border border-[#2e2e2e] bg-[#121212] px-4 py-2 text-sm text-white placeholder-[#777777] outline-none focus:border-[#FF5500]"
                  />
                  <button
                    onClick={handleAdd}
                    className="rounded-lg bg-[#FF5500] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#ff661a] active:scale-95"
                  >
                    Add
                  </button>
                </div>
                {error && <p className="mt-2 text-left text-xs text-red-400">{error}</p>}
              </div>

              <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-4 shadow-md">
                <ul className="grid grid-cols-2 gap-2">
                  {players.map((p) => (
                    <li
                      key={p}
                      className="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] px-3 py-2 text-xs"
                    >
                      <span className="truncate font-medium text-white">{p}</span>
                      <button
                        onClick={() => onRemove(p)}
                        className="ml-2 text-[#a0a0a0] hover:text-[#FF5500]"
                        aria-label={`Remove ${p}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-2">
            <button
              disabled={players.length < 10}
              onClick={onContinue}
              className="w-full rounded-xl bg-[#FF5500] px-8 py-4 text-sm font-black text-white shadow-md transition enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:opacity-40"
            >
              CREATE NEW ROOM 🚀
            </button>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-8 text-center">
          <p className="animate-pulse text-sm font-semibold text-[#FF5500]">
            Connected! Waiting for host to set up the room...
          </p>
        </div>
      )}
    </div>
  );
}
