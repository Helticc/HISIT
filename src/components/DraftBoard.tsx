import type { Team, TeamId } from "../types";
import { Check } from "lucide-react";

const TEAM_SIZE = 5;

export default function DraftBoard({
  teamA,
  teamB,
  pool,
  currentTurn,
  canPick,
  canContinue,
  onPick,
  onContinue,
}: {
  teamA: Team;
  teamB: Team;
  pool: string[];
  currentTurn: TeamId;
  canPick: boolean;
  canContinue: boolean;
  onPick: (player: string) => void;
  onContinue: () => void;
}) {
  const draftComplete =
    (teamA.players.length >= TEAM_SIZE && teamB.players.length >= TEAM_SIZE) || pool.length === 0;

  const currentTeam = currentTurn === "A" ? teamA : teamB;
  const mayClick = canPick && !draftComplete;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
      {/* Turn Indicator */}
      {!draftComplete && (
        <div className="flex justify-center">
          <div
            className={`rounded-full border px-6 py-2 text-[10px] font-black tracking-widest uppercase shadow-md animate-pulse ${
              currentTurn === "A"
                ? "border-[#FF5500] bg-[#1f1f1f] text-[#FF5500]"
                : "border-[#0084ff] bg-[#1f1f1f] text-[#0084ff]"
            }`}
          >
            {currentTeam.name}'S TURN TO PICK
          </div>
        </div>
      )}

      {/* VS Face-off Layout (2 columns on mobile) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <TeamColumn team={teamA} accent="orange" active={currentTurn === "A" && !draftComplete} />
        <TeamColumn team={teamB} accent="blue" active={currentTurn === "B" && !draftComplete} />
      </div>

      {/* Pool of Players */}
      <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-4 shadow-md">
        <h3 className="mb-4 text-[10px] font-black tracking-widest text-[#a0a0a0] uppercase">
          REMAINING POOL ({pool.length})
        </h3>
        {pool.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#777777] italic">No players remaining.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {pool.map((p) => (
              <button
                key={p}
                disabled={!mayClick}
                onClick={() => onPick(p)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition duration-200 ${
                  mayClick
                    ? "border-[#2e2e2e] bg-[#121212] text-white hover:border-[#FF5500] hover:bg-[#2a2a2a] active:scale-95"
                    : "border-[#333333] bg-[#1a1a1a] text-[#777777] opacity-50 cursor-not-allowed"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {draftComplete && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#00c887]">
            <span className="text-xl">
              <Check size={30} color="#00c887"/>
              </span> ROSTERS FINALIZED
          </div>
          {canContinue ? (
            <button
              onClick={onContinue}
              className="w-full max-w-sm rounded-xl bg-[#FF5500] px-8 py-4 text-sm font-black text-white shadow-md transition active:scale-95"
            >
              CONTINUE TO FORMAT ➔
            </button>
          ) : (
            <p className="text-xs text-[#a0a0a0] animate-pulse italic">Waiting for host...</p>
          )}
        </div>
      )}
    </div>
  );
}

function TeamColumn({
  team,
  accent,
  active,
}: {
  team: Team;
  accent: "orange" | "blue";
  active: boolean;
}) {
  const isOrange = accent === "orange";
  return (
    <div
      className={`relative flex flex-col gap-2 rounded-2xl border p-3 transition-all duration-300 sm:p-4 ${
        active
          ? isOrange
            ? "border-[#FF5500] bg-[#121212] ring-1 ring-[#FF5500]/50 shadow-[0_0_15px_-5px_rgba(255,85,0,0.4)]"
            : "border-[#0084ff] bg-[#121212] ring-1 ring-[#0084ff]/50 shadow-[0_0_15px_-5px_rgba(0,132,255,0.4)]"
          : "border-[#333333] bg-[#1a1a1a]"
      }`}
    >
      <div className="mb-2 flex flex-col items-center border-b border-[#333333] pb-2">
        <h3
          className={`text-center text-xs font-black tracking-widest uppercase sm:text-sm ${
            isOrange ? "text-[#FF5500]" : "text-[#0084ff]"
          }`}
        >
          {team.name}
        </h3>
        <span className="mt-1 text-[9px] font-bold text-[#777777] uppercase">
          {team.players.length} / 5
        </span>
      </div>
      <div className="flex flex-col gap-1.5 min-h-[160px]">
        {team.players.map((p, idx) => (
          <div
            key={p}
            className="flex flex-col rounded-lg border border-[#2e2e2e] bg-[#121212] px-2 py-1.5 sm:px-3"
          >
            {idx === 0 && (
              <span className={`text-[8px] font-black uppercase ${isOrange ? "text-[#FF5500]/80" : "text-[#0084ff]/80"}`}>
                Leader
              </span>
            )}
            <span className="truncate text-[10px] font-bold text-white sm:text-xs">{p}</span>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 5 - team.players.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex h-[34px] items-center justify-center rounded-lg border border-dashed border-[#333333] text-[9px] font-bold text-[#555555] uppercase"
          >
            —
          </div>
        ))}
      </div>
    </div>
  );
}
