import type { MatchFormat } from "../types";
import { Hourglass, House } from "lucide-react";
import { Trophy } from "lucide-react";
import { Podium } from "lucide-react";
import { Award } from "lucide-react";

const OPTIONS: { id: MatchFormat; label: string; desc: string }[] = [
  { id: "bo1", label: "Best of 1", desc: "6 bans, 1 decider map" },
  { id: "bo3", label: "Best of 3", desc: "2 bans, 4 picks, 1 decider map" },
  { id: "bo5", label: "Best of 5", desc: "2 bans, 4 picks, 1 decider map" },
];

export default function FormatSelect({
  enabled,
  onSelect,
}: {
  enabled: boolean;
  onSelect: (format: MatchFormat) => void;
}) {
  if (!enabled) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-[#333333] bg-[#1f1f1f] p-8 text-center">
        <div className="text-3xl">
          <Hourglass size={40}/>
          </div>
        <p className="text-sm text-white">The host is choosing the match format…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className="group rounded-2xl border border-[#333333] bg-[#1f1f1f] p-6 text-left shadow-md transition hover:-translate-y-1 hover:border-[#FF5500] active:scale-95"
        >
          <div className="mb-3 text-3xl">{opt.id === "bo1" ? <Award size={40} color="#FFCC4D"/> : opt.id === "bo3" ? <Podium size={40} color="#FFCC4D"/> : <Trophy size={40} color="#FFCC4D"/>}</div>
          <h3 className="text-lg font-bold text-white group-hover:text-[#FF5500]">{opt.label}</h3>
          <p className="mt-1 text-sm text-[#a0a0a0]">{opt.desc}</p>
        </button>
      ))}
    </div>
  );
}
