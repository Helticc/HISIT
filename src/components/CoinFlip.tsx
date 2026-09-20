import { useState, useEffect } from "react";
import type { Team, TeamId } from "../types";
import { HandCoins } from "lucide-react";

export default function CoinFlip({
  teamA,
  teamB,
  winner,
  canFlip,
  canContinue,
  onFlip,
  onContinue,
}: {
  teamA: Team;
  teamB: Team;
  winner: TeamId | null;
  canFlip: boolean;
  canContinue: boolean;
  onFlip(): void;
  onContinue(): void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (winner) {
      setIsAnimating(true);
      // Determine how many spins based on the winner so it stops correctly on the A or B side.
      // 5 full rotations (1800deg) lands back on A (front).
      // 5.5 rotations (1980deg) lands on B (back).
      const targetRot = winner === "A" ? 1800 : 1980;
      setRotation(targetRot);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setRotation(0);
      setIsAnimating(false);
    }
  }, [winner]);

  function handleFlip() {
    if (canFlip && !winner && !isAnimating) {
      onFlip(); // the host resolves this instantly, updating the 'winner' state.
    }
  }

  const winnerTeam = winner === "A" ? teamA : winner === "B" ? teamB : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center min-h-[400px] gap-8 px-6">
      <div className="relative perspective-1000 w-48 h-48">
        <div
          className={`w-full h-full relative preserve-3d`}
          style={{
            transform: `rotateY(${rotation}deg)`,
            transition: isAnimating ? 'transform 2000ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
          }}
        >
          {/* Coin Front */}
          <div className="absolute inset-0 backface-hidden flex items-center justify-center rounded-full border-[10px] border-[#cc4400] bg-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.3)]">
            <span className="text-4xl font-black text-white drop-shadow-md">Heads</span>
          </div>
          {/* Coin Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center rounded-full border-[10px] border-[#005a96] bg-[#0084ff] shadow-[0_0_20px_rgba(0,132,255,0.3)]">
            <span className="text-6xl font-black text-white drop-shadow-md">Tails</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 text-center w-full">
        {!winner && !isAnimating && canFlip && (
          <button
            onClick={handleFlip}
            className="w-full rounded-2xl bg-[#FF5500] px-8 py-5 text-sm font-black text-white shadow-md transition hover:bg-[#ff661a] active:scale-95 uppercase tracking-widest"
          >
            FLIP TO START VETO 
          </button>
          
        )}

        {!winner && !isAnimating && !canFlip && (
          <div className="rounded-xl border border-[#333333] bg-[#1f1f1f] px-6 py-4">
             <p className="text-xs font-bold text-[#a0a0a0] uppercase tracking-widest animate-pulse">Waiting for host to flip...</p>
          </div>
        )}

        {isAnimating && (
          <p className="text-lg font-black italic text-[#FF5500] animate-bounce tracking-widest uppercase">
            FLIPPING...
          </p>
        )}

        {winnerTeam && !isAnimating && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 w-full">
            <div className="rounded-2xl border border-[#333333] bg-[#1a1a1a] p-6 shadow-md w-full">
              <p className="text-xs font-black text-[#FF5500] uppercase tracking-widest mb-2">WINNER</p>
              <p className="text-2xl font-black text-white tracking-tight uppercase italic">{winnerTeam.name}</p>
              <p className="text-[10px] font-bold text-[#777777] mt-2 uppercase tracking-widest">WILL BAN FIRST</p>
            </div>
            
            {canContinue ? (
              <button
                onClick={onContinue}
                className="w-full rounded-2xl bg-[#FF5500] px-8 py-5 text-sm font-black text-white shadow-md transition hover:bg-[#ff661a] active:scale-95 uppercase tracking-widest"
              >
                START VETO ➔
              </button>
            ) : (
              <p className="text-xs font-bold text-[#a0a0a0] uppercase tracking-widest animate-pulse">Waiting for host to proceed...</p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
