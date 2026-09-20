import type { GameState } from "../game/state";
import type { TeamId } from "../types";

// ---------------------------------------------------------------------------
// Peer-to-peer protocol. NO database involved — the peers just hand each other
// in-memory snapshots and actions over a WebRTC data channel.
// ---------------------------------------------------------------------------

/** Actions the second captain (guest) may send to the host. */
export type GuestAction =
  | { type: "setLeaderName"; name: string }
  | { type: "draftPick"; player: string }
  | { type: "vetoAct"; map: string }
  | { type: "vetoSide"; side: TeamId }
  | { type: "coinflip" }
  | { type: "deciderFlip" };

export type NetMessage =
  | { kind: "hello" }
  | { kind: "action"; action: GuestAction }
  | { kind: "state"; state: GameState };
