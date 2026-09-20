import { useState, useEffect } from "react";
import { MAP_POOL } from "../data/database";
import { otherOf, type VetoStep } from "../game/logic";
import type { VetoState } from "../game/state";
import type { Team, TeamId, VetoLogEntry } from "../types";

export default function MapVeto({
  teamA,
  teamB,
  veto,
  log,
  steps,
  myTeam,
  canAdvance,
  onMapClick,
  onSideChoice,
  onDeciderFlip,
  onContinue,
}: {
  teamA: Team;
  teamB: Team;
  veto: VetoState;
  log: VetoLogEntry[];
  steps: VetoStep[];
  myTeam: TeamId | null;
  canAdvance: boolean;
  onMapClick(map: string): void;
  onSideChoice(side: TeamId): void;
  onDeciderFlip(): void;
  onContinue(): void;
}) {
  const teamOf = (id?: TeamId | null) => (id === "A" ? teamA : id === "B" ? teamB : undefined);
  const vetoDone = veto.stepIndex >= steps.length && !veto.pendingSide;
  const decider = veto.maps.find((m) => m.status === "available");
  const currentStep = steps[veto.stepIndex];
  const canActForStep = (team: TeamId) => myTeam === null || myTeam === team;
  const fullyDone = vetoDone && veto.deciderReady;

  // Popup state for the "ban" action
  const [activePopup, setActivePopup] = useState<{team: TeamId | null, action: string, map: string} | null>(null);

  useEffect(() => {
    if (veto.lastAction && veto.lastAction.action === "ban") {
      setActivePopup(veto.lastAction);
      const timer = setTimeout(() => setActivePopup(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [veto.lastAction]);

  // Decider flip animation state
  const [isDeciderFlipping, setIsDeciderFlipping] = useState(false);
  const [deciderRot, setDeciderRot] = useState(0);

  useEffect(() => {
    if (veto.deciderReady && decider?.side) {
      setIsDeciderFlipping(true);
      // 5 spins (1800deg) for front (Team A), 5.5 spins (1980deg) for back (Team B)
      const targetRot = decider.side === "A" ? 1800 : 1980;
      setDeciderRot(targetRot);
      
      const timer = setTimeout(() => {
        setIsDeciderFlipping(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setDeciderRot(0);
      setIsDeciderFlipping(false);
    }
  }, [veto.deciderReady, decider?.side]);

  function handleFlip() {
    if (!veto.deciderReady && (myTeam === null || canAdvance)) {
      onDeciderFlip();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
      {/* Current Turn Indicator */}
      {!vetoDone && currentStep && (
        <div className="flex justify-center">
          <div
            className={`rounded-full border px-6 py-2 text-[10px] font-black tracking-widest uppercase shadow-md animate-pulse ${
              currentStep.team === "A"
                ? "border-[#FF5500] bg-[#1a1a1a] text-[#FF5500]"
                : "border-[#0084ff] bg-[#1a1a1a] text-[#0084ff]"
            }`}
          >
            {teamOf(currentStep.team)?.name} MUST {currentStep.action.toUpperCase()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {veto.maps.map((m) => {
          const clickable = !vetoDone && !veto.pendingSide && m.status === "available" && currentStep && canActForStep(currentStep.team);
          return (
            <button
              key={m.name}
              disabled={!clickable}
              onClick={() => onMapClick(m.name)}
              className={`group relative h-48 overflow-hidden rounded-2xl border transition-all duration-300 ${
                m.status === "banned"
                  ? "border-[#333333] grayscale opacity-40"
                  : m.status === "picked" || m.status === "decider"
                  ? "border-[#FF5500] ring-2 ring-[#FF5500]/50"
                  : clickable
                  ? "border-[#2e2e2e] hover:border-[#FF5500]"
                  : "border-[#333333] cursor-not-allowed"
              }`}
            >
              <div className="absolute inset-0">
                <img src={m.image} alt={m.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent ${m.status === "banned" ? "bg-[#0f0f0f]/80" : ""}`} />
              </div>
              <div className="relative flex h-full flex-col justify-end p-4">
                <div className="mb-2 h-10 w-10 drop-shadow-xl">
                  <img src={m.icon} alt={m.name} className="h-full w-full object-contain" />
                </div>
                <p className="text-xl font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">{m.name}</p>
                {m.status === "banned" && <p className="mt-1 text-[9px] font-black text-[#ff3333] uppercase tracking-widest">BANNED BY {teamOf(m.actor)?.name}</p>}
                {m.status === "picked" && (
                   <div>
                      <p className="mt-1 text-[9px] font-black text-[#FF5500] uppercase tracking-widest">PICKED BY {teamOf(m.actor)?.name}</p>
                      {m.side && <p className="text-[8px] font-bold text-white uppercase bg-[#121212]/80 px-2 py-0.5 rounded-sm inline-block mt-1">{teamOf(m.side)?.name} STARTS {m.side === m.actor ? 'T' : 'CT'}</p>}
                   </div>
                )}
                {m.status === "decider" && (
                   <div>
                      <p className="mt-1 text-[9px] font-black text-white uppercase tracking-widest">DECIDER MAP</p>
                      {m.side && <p className="text-[8px] font-bold text-white uppercase bg-[#121212]/80 px-2 py-0.5 rounded-sm inline-block mt-1">{teamOf(m.side)?.name} STARTS CT</p>}
                   </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* POPUP: ACTION TAKEN (BAN) */}
      {activePopup && !veto.pendingSide && !vetoDone && (() => {
        const activeMapInfo = MAP_POOL.find((m) => m.name === activePopup.map);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#121212]/90 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="relative w-full max-w-sm rounded-3xl border border-[#333333] bg-[#1f1f1f] text-center shadow-md overflow-hidden">
                {activeMapInfo && (
                  <div className="absolute inset-0 z-0 opacity-30">
                    <img src={activeMapInfo.image} className="h-full w-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-[#121212]/70" />
                  </div>
                )}
                <div className="relative z-10 p-8">
                   <button 
                      onClick={() => setActivePopup(null)}
                      className="absolute top-5 right-6 text-xl text-[#777777] hover:text-white transition" 
                   >
                     ✕
                   </button>
                   <div className="mb-6 mx-auto h-24 w-24 rounded-full border-4 border-[#ff3333] flex items-center justify-center bg-[#ff3333]/10">
                      <span className="text-4xl text-[#ff3333]">✕</span>
                   </div>
                   <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">{teamOf(activePopup.team)?.name}</h3>
                   <p className="text-sm font-bold text-[#a0a0a0] uppercase tracking-widest mt-2">HAS BANNED</p>
                   <div className="flex items-center justify-center gap-3 mt-4">
                     {activeMapInfo && <img src={activeMapInfo.icon} className="h-8 w-8 drop-shadow-lg opacity-80" alt="" />}
                     <p className="text-3xl font-black text-white uppercase italic tracking-tighter">{activePopup.map}</p>
                   </div>
                </div>
             </div>
          </div>
        );
      })()}

      {/* POPUP: SIDE SELECTION */}
      {veto.pendingSide && (() => {
        const pendingMapInfo = MAP_POOL.find((m) => m.name === veto.pendingSide?.map);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#121212]/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm rounded-3xl border border-[#333333] bg-[#1f1f1f] text-center shadow-md overflow-hidden">
              {pendingMapInfo && (
                  <div className="absolute inset-0 z-0 opacity-30">
                    <img src={pendingMapInfo.image} className="h-full w-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-[#121212]/70" />
                  </div>
              )}
              <div className="relative z-10 p-8">
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">{teamOf(veto.pendingSide.chooser)?.name}</h3>
                <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest mt-2">CHOOSE STARTING SIDE FOR</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  {pendingMapInfo && <img src={pendingMapInfo.icon} className="h-8 w-8 drop-shadow-lg opacity-80" alt="" />}
                  <p className="text-3xl font-black text-[#FF5500] uppercase italic tracking-tighter">{veto.pendingSide.map}</p>
                </div>
                
                {canActForStep(veto.pendingSide.chooser) ? (
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => onSideChoice(veto.pendingSide!.chooser)}
                      className="flex-1 rounded-xl border border-[#0084ff] bg-[#0084ff]/10 py-4 text-sm font-black text-[#0084ff] shadow-md transition active:scale-95 uppercase backdrop-blur-md"
                    >
                      START CT
                    </button>
                    <button
                      onClick={() => onSideChoice(otherOf(veto.pendingSide!.chooser))}
                      className="flex-1 rounded-xl border border-[#FF5500] bg-[#FF5500]/10 py-4 text-sm font-black text-[#FF5500] shadow-md transition active:scale-95 uppercase backdrop-blur-md"
                    >
                      START T
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 p-4 rounded-xl bg-[#121212]/50 backdrop-blur-md">
                    <p className="text-xs font-bold text-[#777777] uppercase tracking-widest animate-pulse italic">Waiting for leader...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* POPUP: DECIDER COIN FLIP */}
      {vetoDone && decider && !veto.deciderReady && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#121212]/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl border border-[#333333] bg-[#1f1f1f] p-8 text-center shadow-md">
            <h3 className="text-sm font-black text-[#FF5500] uppercase tracking-widest mb-6 italic">DECIDER COIN FLIP</h3>
            
            <div className="relative w-32 h-32 mx-auto perspective-1000 mb-8">
               <div 
                 className="w-full h-full preserve-3d" 
                 style={{ 
                   transform: `rotateY(${deciderRot}deg)`,
                   transition: isDeciderFlipping ? 'transform 2000ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                 }}
               >
                  <div className="absolute inset-0 backface-hidden flex items-center justify-center rounded-full border-[6px] border-[#cc4400] bg-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.3)]">
                     <span className="text-4xl font-black text-white drop-shadow-md">A</span>
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center rounded-full border-[6px] border-[#005a96] bg-[#0084ff] shadow-[0_0_20px_rgba(0,132,255,0.3)]">
                     <span className="text-4xl font-black text-white drop-shadow-md">B</span>
                  </div>
               </div>
            </div>

            <p className="text-xl font-black text-white uppercase italic tracking-tighter mb-8">{decider.name}</p>

            {(canActForStep("A") || canActForStep("B") || canAdvance) && (
              <button
                onClick={handleFlip}
                disabled={isDeciderFlipping}
                className="w-full rounded-xl bg-[#FF5500] hover:bg-[#ff661a] py-4 text-sm font-black text-white shadow-md transition active:scale-95 uppercase tracking-widest"
              >
                {isDeciderFlipping ? "FLIPPING..." : "FLIP FOR STARTING SIDE"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Veto Log */}
      <div className="rounded-2xl border border-[#333333] bg-[#1f1f1f] p-5 shadow-md">
        <h3 className="mb-4 text-[10px] font-black tracking-widest text-[#a0a0a0] uppercase">VETO PROCESS LOG</h3>
        <div className="flex flex-col gap-2">
          {log.length === 0 && <p className="text-[10px] font-bold text-[#777777] italic">PROCESS INITIALIZING...</p>}
          {log.map((entry, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg bg-[#121212] p-3 text-[10px] font-bold border border-[#2e2e2e]">
              <div className="flex items-center gap-3">
                <span className="w-4 text-[#777777]">{idx + 1}.</span>
                <div>
                  <span className={entry.team === "A" ? "text-[#FF5500]" : entry.team === "B" ? "text-[#0084ff]" : "text-[#FF5500]"}>
                    {entry.team ? teamOf(entry.team)?.name : "COIN FLIP"}
                  </span>
                  <span className="mx-2 text-[#777777] uppercase tracking-tighter">{entry.action === "ban" ? "BANNED" : entry.action === "pick" ? "PICKED" : "DECIDER"}</span>
                  <span className="text-white uppercase italic">{entry.map}</span>
                </div>
              </div>
              {entry.side && (
                <div className="sm:ml-auto mt-2 sm:mt-0 text-[9px] px-2 py-1 rounded bg-[#1a1a1a] border border-[#333333] text-[#e0e0e0] text-center sm:text-right">
                  Team_{teamOf(entry.side)?.name} will start on <span className="text-[#0084ff] font-black text-sm">CT</span>, Team_{teamOf(otherOf(entry.side))?.name} will start on <span className="text-[#FF5500] font-black text-sm">T</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {fullyDone && canAdvance && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onContinue}
            className="w-full max-w-sm rounded-xl bg-[#FF5500] hover:bg-[#ff661a] px-8 py-5 text-sm font-black text-white shadow-md transition active:scale-95 uppercase tracking-widest"
          >
            VIEW FINAL SUMMARY ➔
          </button>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
