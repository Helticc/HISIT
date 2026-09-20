import type { MapState, MatchFormat, Stage, Team, TeamId, VetoLogEntry } from "../types";
import { DEFAULT_PLAYERS, TEAM_COLORS, MAP_POOL } from "../data/database";

// ---------------------------------------------------------------------------
// The ENTIRE game state in one serializable object. This is the "database" —
// it lives in memory on the host device only, and snapshots of it are sent
// peer-to-peer to the second captain's device. Nothing is persisted anywhere.
// ---------------------------------------------------------------------------

export interface VetoState {
  maps: MapState[];
  stepIndex: number;
  pendingSide: { map: string; chooser: TeamId } | null;
  deciderReady: boolean;
  lastAction: { team: TeamId | null; action: VetoActionType; map: string } | null;
}

import { VetoActionType } from "../types";

export interface GameState {
  stage: Stage;
  pool: string[];
  teamA: Team;
  teamB: Team;
  currentTurn: TeamId;
  /** Which captain the room host controls. The joined player gets the other. */
  hostCaptain: TeamId;
  format: MatchFormat;
  startingTeam: TeamId;
  coinWinner: TeamId | null;
  veto: VetoState;
  log: VetoLogEntry[];
}

export function freshVeto(): VetoState {
  return {
    maps: MAP_POOL.map((m) => ({ 
      name: m.name, 
      icon: m.icon, 
      image: m.image,
      status: "available" as const 
    })),
    stepIndex: 0,
    pendingSide: null,
    deciderReady: false,
    lastAction: null,
  };
}

export function initialGameState(): GameState {
  return {
    stage: "pool",
    pool: [...DEFAULT_PLAYERS],
    teamA: { name: "Captain 1", captain: "", players: [], color: TEAM_COLORS.A },
    teamB: { name: "Captain 2", captain: "", players: [], color: TEAM_COLORS.B },
    currentTurn: "A",
    hostCaptain: "A",
    format: "bo1",
    startingTeam: "A",
    coinWinner: null,
    veto: freshVeto(),
    log: [],
  };
}
