export type Stage = "pool" | "room" | "lobby" | "draft" | "format" | "coinflip" | "veto" | "side_selection" | "summary";

export type TeamId = "A" | "B";

export interface Team {
  name: string;
  captain: string;
  players: string[]; // includes captain
  color: string;
}

export type MatchFormat = "bo1" | "bo3" | "bo5";

export type VetoActionType = "ban" | "pick" | "decider";

export interface VetoStep {
  team: TeamId | null; // null for decider
  action: VetoActionType;
}

export interface MapState {
  name: string;
  icon: string;
  image: string;
  status: "available" | "banned" | "picked" | "decider";
  actor?: TeamId;
  side?: TeamId; // which team starts as CT on this map
  order?: number;
}

export interface VetoLogEntry {
  team: TeamId | null;
  action: VetoActionType;
  map: string;
  side?: TeamId;
}
