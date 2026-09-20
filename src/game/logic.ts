import type { GameState } from "./state";
import { initialGameState } from "./state";
import type { MapState, MatchFormat, TeamId, VetoActionType } from "../types";
import type { GuestAction } from "../net/messages";

export const otherOf = (t: TeamId): TeamId => (t === "A" ? "B" : "A");

export interface VetoStep {
  team: TeamId;
  action: VetoActionType;
}

/** Official CS2-style veto order for each match format (alternating teams). */
export function buildVetoSteps(format: MatchFormat, startingTeam: TeamId): VetoStep[] {
  const actions: VetoActionType[] =
    format === "bo1"
      ? ["ban", "ban", "ban", "ban", "ban", "ban"]
      : format === "bo3"
      ? ["ban", "ban", "pick", "pick", "ban", "ban"]
      : ["ban", "ban", "pick", "pick", "pick", "pick"];

  return actions.map((action, idx) => ({
    action,
    team: idx % 2 === 0 ? startingTeam : otherOf(startingTeam),
  }));
}

export const teamOf = (s: GameState, id: TeamId) => (id === "A" ? s.teamA : s.teamB);

export function draftComplete(s: GameState): boolean {
  return (s.teamA.players.length >= 5 && s.teamB.players.length >= 5) || s.pool.length === 0;
}

export function vetoStepsDone(s: GameState): boolean {
  return s.veto.stepIndex >= buildVetoSteps(s.format, s.startingTeam).length;
}

// ---- Player pool (host only) -------------------------------------------

export function addPlayer(s: GameState, name: string): GameState {
  const trimmed = name.trim();
  if (!trimmed || s.pool.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return s;
  return { ...s, pool: [...s.pool, trimmed] };
}

export function removePlayer(s: GameState, name: string): GameState {
  return { ...s, pool: s.pool.filter((p) => p !== name) };
}

// ---- Room creation (host only) ------------------------------------------

export function createRoom(s: GameState, capA: string): GameState {
  return {
    ...s,
    stage: "lobby",
    pool: s.pool.filter((p) => p !== capA),
    teamA: { ...s.teamA, name: capA, captain: capA, players: [capA] },
    // Leader B will join via code and set their name then.
    teamB: { ...s.teamB, name: "Pending...", captain: "", players: [] },
    currentTurn: "A",
  };
}

export function leaderBJoin(s: GameState, name: string): GameState {
  if (s.teamB.captain) return s;
  return {
    ...s,
    pool: s.pool.filter((p) => p !== name),
    teamB: { ...s.teamB, name: name, captain: name, players: [name] },
  };
}

export function goToStage(s: GameState, stage: GameState["stage"]): GameState {
  return { ...s, stage };
}

// ---- Draft ---------------------------------------------------------------

export function pickPlayer(s: GameState, player: string): GameState {
  if (s.stage !== "draft" || !s.pool.includes(player)) return s;
  const teamKey = s.currentTurn === "A" ? "teamA" : "teamB";
  if (s[teamKey].players.length >= 5) return s;

  const updatedTeam = { ...s[teamKey], players: [...s[teamKey].players, player] };
  const ns: GameState = {
    ...s,
    [teamKey]: updatedTeam,
    pool: s.pool.filter((p) => p !== player),
  };

  const other = otherOf(s.currentTurn);
  const otherTeam = teamOf(ns, other);
  const meTeam = teamOf(ns, s.currentTurn);

  // Alternate turns, skipping a team once its roster is full.
  if (otherTeam.players.length < 5) ns.currentTurn = other;
  else if (meTeam.players.length < 5) ns.currentTurn = s.currentTurn;

  return ns;
}

// ---- Format / coin flip (host only except flip request) ------------------

export function selectFormat(s: GameState, format: MatchFormat): GameState {
  return { ...s, format, stage: "coinflip", coinWinner: null };
}

export function flipCoin(s: GameState): GameState {
  if (s.coinWinner) return s;
  const winner: TeamId = Math.random() < 0.5 ? "A" : "B";
  return { ...s, startingTeam: winner, coinWinner: winner };
}

// ---- Map veto ------------------------------------------------------------

export function vetoAct(s: GameState, mapName: string): GameState {
  if (s.stage !== "veto" || s.veto.pendingSide) return s;
  const step = buildVetoSteps(s.format, s.startingTeam)[s.veto.stepIndex];
  if (!step) return s;
  const idx = s.veto.maps.findIndex((m) => m.name === mapName && m.status === "available");
  if (idx === -1) return s;

  const maps = s.veto.maps.map((m) => ({ ...m }));
  const target = maps[idx];
  const actionEntry = { team: step.team, action: step.action, map: target.name };
  const log = [...s.log, actionEntry];

  if (step.action === "ban") {
    target.status = "banned";
    target.actor = step.team;
    return { 
      ...s, 
      veto: { ...s.veto, maps, stepIndex: s.veto.stepIndex + 1, lastAction: actionEntry }, 
      log 
    };
  }

  target.status = "picked";
  target.actor = step.team;
  target.order = maps.filter((m) => m.status === "picked").length;
  return {
    ...s,
    veto: { 
      ...s.veto, 
      maps, 
      pendingSide: { map: target.name, chooser: otherOf(step.team) },
      lastAction: actionEntry 
    },
    log,
  };
}

export function vetoChooseSide(s: GameState, side: TeamId): GameState {
  if (s.stage !== "veto" || !s.veto.pendingSide) return s;
  const { map, chooser } = s.veto.pendingSide;
  if (side !== chooser && side !== otherOf(chooser)) return s;

  const maps = s.veto.maps.map((m) => (m.name === map ? { ...m, side } : m));
  const log = s.log.map((entry, i) => (i === s.log.length - 1 ? { ...entry, side } : entry));
  return {
    ...s,
    veto: { ...s.veto, maps, pendingSide: null, stepIndex: s.veto.stepIndex + 1 },
    log,
  };
}

export function deciderFlip(s: GameState): GameState {
  if (s.stage !== "veto" || s.veto.deciderReady || s.veto.pendingSide || !vetoStepsDone(s)) return s;
  const remaining = s.veto.maps.find((m) => m.status === "available");
  if (!remaining) return s;

  const side: TeamId = Math.random() < 0.5 ? "A" : "B";
  const pickedCount = s.veto.maps.filter((m) => m.status === "picked").length;
  const maps: MapState[] = s.veto.maps.map((m) =>
    m.name === remaining.name
      ? { ...m, status: "decider" as const, side, order: pickedCount + 1 }
      : { ...m }
  );
  return {
    ...s,
    veto: { ...s.veto, maps, deciderReady: true },
    log: [...s.log, { team: null, action: "decider", map: remaining.name, side }],
  };
}

// ---- Restart (host only) --------------------------------------------------

export function restart(s: GameState): GameState {
  return { ...initialGameState(), hostCaptain: s.hostCaptain };
}

// ---- Guest permission checks (host validates before applying) --------------

export function guestAllowed(s: GameState, guestCaptain: TeamId, a: GuestAction): boolean {
  switch (a.type) {
    case "setLeaderName":
      return s.stage === "lobby" && !s.teamB.captain;
    case "draftPick": {
      if (s.stage !== "draft" || draftComplete(s)) return false;
      return s.currentTurn === guestCaptain && teamOf(s, guestCaptain).players.length < 5;
    }
    case "vetoAct": {
      if (s.stage !== "veto" || s.veto.pendingSide) return false;
      const step = buildVetoSteps(s.format, s.startingTeam)[s.veto.stepIndex];
      return !!step && step.team === guestCaptain;
    }
    case "vetoSide": {
      if (s.stage !== "veto" || !s.veto.pendingSide) return false;
      return s.veto.pendingSide.chooser === guestCaptain;
    }
    case "coinflip":
      return s.stage === "coinflip" && !s.coinWinner;
    case "deciderFlip":
      return s.stage === "veto" && !s.veto.deciderReady && !s.veto.pendingSide && vetoStepsDone(s);
    default:
      return false;
  }
}

export function applyGuestAction(s: GameState, a: GuestAction): GameState {
  switch (a.type) {
    case "setLeaderName": return leaderBJoin(s, a.name);
    case "draftPick": return pickPlayer(s, a.player);
    case "vetoAct": return vetoAct(s, a.map);
    case "vetoSide": return vetoChooseSide(s, a.side);
    case "coinflip": return flipCoin(s);
    case "deciderFlip": return deciderFlip(s);
    default: return s;
  }
}
