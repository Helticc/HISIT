import { MAP_POOL } from "../data/database";
import type { MapState, MatchFormat, Team, TeamId, VetoLogEntry } from "../types";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

export default function MatchSummary({
  teamA,
  teamB,
  format,
  maps,
  vetoLog,
  canRestart,
  onRestart,
}: {
  teamA: Team;
  teamB: Team;
  format: MatchFormat;
  maps: MapState[];
  vetoLog: VetoLogEntry[];
  canRestart: boolean;
  onRestart: () => void;
}) {
  const [openTeamA, setOpenTeamA] = useState(false);
  const [openTeamB, setOpenTeamB] = useState(false);

  const teamOf = (id?: TeamId) => (id === "A" ? teamA : id === "B" ? teamB : undefined);

  const playedMaps = maps
    .filter((m) => m.status === "picked" || m.status === "decider")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const bannedMaps = maps.filter((m) => m.status === "banned");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4">
      {/* VS Head-to-Head Rosters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RosterCard 
          team={teamA} 
          accent="orange" 
          isOpen={openTeamA} 
          onToggle={() => setOpenTeamA(!openTeamA)} 
        />
        <RosterCard 
          team={teamB} 
          accent="blue" 
          isOpen={openTeamB} 
          onToggle={() => setOpenTeamB(!openTeamB)} 
        />
      </div>

      {/* Map Order List */}
      <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-5 shadow-md">
        <h3 className="mb-4 text-[10px] font-black tracking-widest text-[#a0a0a0] uppercase">
          MATCH MAPS ({format.toUpperCase()})
        </h3>
        <div className="flex flex-col gap-3">
          {playedMaps.map((m, idx) => {
            const info = MAP_POOL.find((mp) => mp.name === m.name)!;
            const starter = teamOf(m.side);
            return (
              <div
                key={m.name}
                className="relative overflow-hidden rounded-xl border border-[#333333] bg-[#121212]"
              >
                <div className="absolute inset-0 opacity-20">
                  <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#121212] to-transparent" />
                </div>
                
                <div className="relative flex items-center gap-4 p-4">
                  <div className="h-12 w-12 shrink-0 drop-shadow-lg">
                    <img src={info.icon} alt={m.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-black text-white uppercase italic tracking-tighter">
                      #{idx + 1} {m.name}
                      {m.status === "decider" && (
                        <span className="ml-2 rounded bg-[#FF5500]/20 px-2 py-0.5 text-[8px] font-black text-white uppercase">
                          Decider
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-col items-start gap-1">
                      <p className="text-[9px] font-bold text-[#777777] uppercase">
                        {m.status === "picked" ? `PICKED BY ${teamOf(m.actor)?.name}` : "COIN FLIP DECIDER"}
                      </p>
                      {starter && (
                        <div className="flex flex-col gap-0.5 text-[8px] font-black text-[#e0e0e0] bg-[#1a1a1a] px-2 py-1 rounded">
                          <p>Team_{teamOf(m.side)?.name} starts <span className="text-[#0084ff]">CT</span></p>
                          <p>Team_{teamOf(m.side === "A" ? "B" : "A")?.name} starts <span className="text-[#FF5500]">T</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banned Maps Summary */}
      <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-5 shadow-md">
        <h3 className="mb-3 text-[10px] font-black tracking-widest text-[#a0a0a0] uppercase">BANNED MAPS</h3>
        <div className="flex flex-wrap gap-2">
          {bannedMaps.map((m) => {
            const info = MAP_POOL.find((mp) => mp.name === m.name)!;
            return (
              <div
                key={m.name}
                className="flex items-center gap-2 rounded-full border border-[#333333] bg-[#121212] px-3 py-1.5 text-[9px] font-bold text-[#a0a0a0]"
              >
                <img src={info.icon} alt={m.name} className="h-4 w-4 object-contain opacity-50" />
                <span className="uppercase">{m.name}</span>
                <span className={m.actor === "A" ? "text-[#FF5500]" : "text-[#0084ff]"}>
                  ({teamOf(m.actor)?.name})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Process Log */}
      <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-5 shadow-md">
        <h3 className="mb-3 text-[10px] font-black tracking-widest text-[#a0a0a0] uppercase">VETO LOG</h3>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
          {vetoLog.map((entry, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg bg-[#121212] p-2 text-[9px] font-bold border border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                <span className="text-[#777777]">{idx + 1}.</span>
                <div>
                  <span className={entry.team === "A" ? "text-[#FF5500]" : entry.team === "B" ? "text-[#0084ff]" : "text-white"}>
                    {entry.team ? teamOf(entry.team)?.name : "COIN FLIP"}
                  </span>
                  <span className="mx-1 text-[#777777] uppercase tracking-tighter">{entry.action === "ban" ? "BANNED" : entry.action === "pick" ? "PICKED" : "DECIDER"}</span>
                  <span className="text-white uppercase italic">{entry.map}</span>
                </div>
              </div>
              {entry.side && (
                <div className="sm:ml-auto w-full sm:w-auto text-[9px] font-bold text-[#e0e0e0] bg-[#1a1a1a] rounded px-2 py-1 text-center sm:text-right border border-[#333333]">
                  Team_{teamOf(entry.side)?.name} will start on <span className="text-[#0084ff] font-black">CT</span>, Team_{teamOf(entry.side === "A" ? "B" : "A")?.name} will start on <span className="text-[#FF5500] font-black">T</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        {canRestart ? (
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full max-w-sm rounded-xl border border-[#FF5500] bg-[#FF5500] py-4 text-xs font-black text-white transition hover:bg-[#ff661a] active:scale-95 uppercase tracking-widest shadow-md"
          >
            START NEW SESSION <RotateCcw size={24}/>
          </button>
        ) : (
          <p className="text-[10px] font-black text-[#777777] animate-pulse uppercase tracking-widest">Waiting for host to restart session...</p>
        )}
      </div>
    </div>
  );
}

function RosterCard({ 
  team, 
  accent, 
  isOpen, 
  onToggle 
}: { 
  team: Team; 
  accent: "orange" | "blue"; 
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isOrange = accent === "orange";
  // Custom format: Team_[name]
  const teamLabel = `Team_${team.name}`;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isOrange ? "border-[#FF5500] bg-[#121212]" : "border-[#0084ff] bg-[#121212]"}`}>
      <button 
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="text-left">
          <p className={`text-[9px] font-black tracking-widest uppercase ${isOrange ? "text-[#FF5500]" : "text-[#0084ff]"}`}>
            {isOrange ? "CAPTAIN A" : "CAPTAIN B"}
          </p>
          <h3 className={`text-lg font-black tracking-tighter uppercase italic text-white`}>
            {teamLabel}
          </h3>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-[#a0a0a0]`}>▼</div>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-1.5 border-t border-[#333333] pt-3">
            {team.players.map((p, idx) => (
              <div key={p} className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2 text-[10px] font-bold">
                <span className="text-white uppercase">{p}</span>
                {idx === 0 && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isOrange ? 'bg-[#FF5500] text-white' : 'bg-[#0084ff] text-white'}`}>LEADER</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
