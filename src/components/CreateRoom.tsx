import { useState } from "react";

export default function CreateRoom({
  players,
  readOnly,
  onCreate,
  onBack,
}: {
  players: string[];
  readOnly?: boolean;
  onCreate: (captainA: string) => void;
  onBack: () => void;
}) {
  const [captainA, setCaptainA] = useState("");
  const [error, setError] = useState("");
  const [isPoolOpen, setIsPoolOpen] = useState(false);

  if (readOnly) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-[#333333] bg-[#1f1f1f] p-8 text-center">
        <div className="text-3xl">⏳</div>
        <p className="text-sm text-white">
          The host is setting up the room. Your screen will follow automatically.
        </p>
      </div>
    );
  }

  const findMatch = (val: string) =>
    players.find((p) => p.toLowerCase() === val.trim().toLowerCase());

  function handleSubmit() {
    const a = captainA.trim();
    if (!a) {
      setError("Please enter a name for Team Leader A.");
      return;
    }
    const matchA = findMatch(a);
    if (!matchA) {
      setError(`"${a}" is not in the pool. Please add them first.`);
      return;
    }
    onCreate(matchA);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 sm:px-0">
      <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-6 shadow-md">
        <p className="mb-5 text-xs text-[#a0a0a0]">
          Enter your name as <span className="text-[#FF5500] font-bold uppercase">Team Leader A</span>.
          Leader B will join the room using the code and enter their name then.
        </p>

        <div className="rounded-xl border border-[#333333] bg-[#121212] p-5">
          <label className="mb-2 block text-[10px] font-black tracking-widest text-[#FF5500] uppercase">
            Team Leader A
          </label>
          <input
            value={captainA}
            onChange={(e) => {
              setCaptainA(e.target.value);
              setError("");
            }}
            list="player-list"
            placeholder="Search your name..."
            className="w-full rounded-lg border border-[#2e2e2e] bg-[#121212] px-4 py-3 text-sm text-white placeholder-[#777777] outline-none focus:border-[#FF5500]"
          />
        </div>

        <datalist id="player-list">
          {players.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setIsPoolOpen(!isPoolOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-[#333333] bg-[#1f1f1f] px-5 py-3 text-sm font-bold shadow-md"
        >
          <span className="text-white">PLAYER POOL ({players.length})</span>
          <span className={`transition-transform duration-300 ${isPoolOpen ? "rotate-180" : ""} text-[#a0a0a0]`}>
            ▼
          </span>
        </button>

        {isPoolOpen && (
          <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <ul className="grid grid-cols-2 gap-2">
              {players.map((p) => (
                <li
                  key={p}
                  className="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] px-3 py-2 text-xs"
                >
                  <span className="truncate font-medium text-white">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="mt-2 w-full rounded-xl bg-[#FF5500] px-8 py-4 text-sm font-black text-white shadow-md transition active:scale-95"
        >
          CREATE LOBBY ➔
        </button>
        <button
          onClick={onBack}
          className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] py-3 text-xs font-bold text-[#a0a0a0] transition hover:bg-[#2a2a2a] active:scale-95"
        >
          BACK
        </button>
      </div>
    </div>
  );
}
