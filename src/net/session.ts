import Peer, { type DataConnection } from "peerjs";
import type { GameState } from "../game/state";
import type { GuestAction, NetMessage } from "./messages";

// ---------------------------------------------------------------------------
// PeerJS powers ONLY the connection handshake (signaling). Once the two
// captains' devices are connected, all game data flows directly peer-to-peer
// through WebRTC data channels. Nothing is stored on any server or database.
// ---------------------------------------------------------------------------

const PREFIX = "scrim5v5-";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

export interface HostHandle {
  code: string;
  broadcast(state: GameState): void;
  destroy(): void;
}

export function hostRoom(callbacks: {
  getState(): GameState;
  onGuestAction(action: GuestAction): void;
  onReady(code: string): void;
  onPeersChange(connected: boolean): void;
  onError(message: string): void;
}): HostHandle {
  let peer: Peer | null = null;
  let connections: DataConnection[] = [];
  let destroyed = false;
  let retries = 0;

  const broadcast = (state: GameState) => {
    const msg: NetMessage = { kind: "state", state };
    connections.forEach((c) => {
      if (c.open) {
        try { c.send(msg); } catch { /* ignore */ }
      }
    });
  };

  const attach = (conn: DataConnection) => {
    conn.on("data", (raw) => {
      const msg = raw as NetMessage;
      if (msg.kind === "hello") {
        if (conn.open) {
          try { conn.send({ kind: "state", state: callbacks.getState() }); } catch { /* ignore */ }
        }
      } else if (msg.kind === "action") {
        callbacks.onGuestAction(msg.action);
      }
    });
    conn.on("open", () => {
      connections.push(conn);
      callbacks.onPeersChange(true);
    });
    conn.on("close", () => {
      connections = connections.filter((c) => c !== conn);
      if (connections.length === 0) callbacks.onPeersChange(false);
    });
  };

  const attempt = () => {
    if (destroyed) return;
    const code = randomCode();
    const p = new Peer(PREFIX + code.toLowerCase());
    peer = p;
    p.on("open", () => {
      if (destroyed) { p.destroy(); return; }
      callbacks.onReady(code);
    });
    p.on("connection", attach);
    p.on("error", (err) => {
      const type = (err as { type?: string }).type ?? "";
      if (type === "unavailable-id" && retries < 5) {
        retries += 1;
        p.destroy();
        attempt();
      } else if (!destroyed) {
        callbacks.onError("Could not create the room code. Check your connection and retry.");
      }
    });
  };

  attempt();

  return {
    get code() { return ""; },
    broadcast,
    destroy() {
      destroyed = true;
      connections.forEach((c) => { try { c.close(); } catch { /* ignore */ } });
      connections = [];
      if (peer) try { peer.destroy(); } catch { /* ignore */ }
    },
  };
}

export interface GuestHandle {
  send(action: GuestAction): void;
  destroy(): void;
}

export function joinRoom(code: string, callbacks: {
  onState(state: GameState): void;
  onOpen(): void;
  onClose(): void;
  onError(message: string): void;
}): GuestHandle {
  const peer = new Peer();
  let conn: DataConnection | null = null;
  let destroyed = false;

  peer.on("open", () => {
    conn = peer.connect(PREFIX + code.trim().toLowerCase(), { reliable: true });
    conn.on("open", () => {
      if (destroyed) { conn?.close(); return; }
      conn?.send({ kind: "hello" } satisfies NetMessage);
      callbacks.onOpen();
    });
    conn.on("data", (raw) => {
      const msg = raw as NetMessage;
      if (msg.kind === "state") callbacks.onState(msg.state);
    });
    conn.on("close", () => { if (!destroyed) callbacks.onClose(); });
  });

  peer.on("error", (err) => {
    const type = (err as { type?: string }).type ?? "";
    if (destroyed) return;
    if (type === "peer-unavailable") {
      callbacks.onError("Room not found — double-check the code.");
    } else {
      callbacks.onError("Connection failed. Check your network and retry.");
    }
  });

  return {
    send(action: GuestAction) {
      if (conn && conn.open) {
        try { conn.send({ kind: "action", action } satisfies NetMessage); } catch { /* ignore */ }
      }
    },
    destroy() {
      destroyed = true;
      if (conn) try { conn.close(); } catch { /* ignore */ }
      try { peer.destroy(); } catch { /* ignore */ }
    },
  };
}
