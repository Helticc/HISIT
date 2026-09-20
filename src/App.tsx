import { useEffect, useRef, useState, type ReactNode } from "react";
import StageShell from "./components/StageShell";
import PlayerPool from "./components/PlayerPool";
import CreateRoom from "./components/CreateRoom";
import Lobby from "./components/Lobby";
import DraftBoard from "./components/DraftBoard";
import FormatSelect from "./components/FormatSelect";
import CoinFlip from "./components/CoinFlip";
import MapVeto from "./components/MapVeto";
import MatchSummary from "./components/MatchSummary";
import { initialGameState, type GameState } from "./game/state";
import {
  addPlayer,
  applyGuestAction,
  buildVetoSteps,
  createRoom,
  deciderFlip,
  flipCoin,
  draftComplete,
  goToStage,
  guestAllowed,
  otherOf,
  pickPlayer,
  removePlayer,
  restart,
  selectFormat,
  vetoAct,
  vetoChooseSide,
} from "./game/logic";
import { hostRoom, joinRoom, type GuestHandle, type HostHandle } from "./net/session";
import type { GuestAction } from "./net/messages";
import type { MatchFormat, Stage, TeamId } from "./types";

type Net =
  | { mode: "solo"; connected: false; code: null }
  | { mode: "host"; connected: boolean; code: string }
  | { mode: "guest"; connected: boolean; code: string };

const SOLO: Net = { mode: "solo", connected: false, code: null };

export default function App() {
  const [game, setGame] = useState<GameState>(initialGameState);
  const [net, setNet] = useState<Net>(SOLO);
  const [hostActive, setHostActive] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [joinError, setJoinError] = useState("");

  const gameRef = useRef(game);
  gameRef.current = game;
  const netRef = useRef(net);
  netRef.current = net;
  const hostRef = useRef<HostHandle | null>(null);
  const guestRef = useRef<GuestHandle | null>(null);

  useEffect(() => {
    if (net.mode === "host") hostRef.current?.broadcast(game);
  }, [game, net.mode]);

  const me: TeamId | null =
    net.mode === "solo" ? null : net.mode === "host" ? game.hostCaptain : otherOf(game.hostCaptain);

  function openHostRoom() {
    if (hostRef.current) return;
    setHostActive(true);
    hostRef.current = hostRoom({
      getState: () => gameRef.current,
      onGuestAction: (action: GuestAction) => {
        const s = gameRef.current;
        const guestCaptain = otherOf(s.hostCaptain);
        if (guestAllowed(s, guestCaptain, action)) {
          setGame((prev) => applyGuestAction(prev, action));
        }
      },
      onReady: (code) => setNet({ mode: "host", connected: false, code }),
      onPeersChange: (connected) =>
        setNet((n) => (n.mode === "host" ? { ...n, connected } : n)),
      onError: (msg) => {
        setHostActive(false);
        hostRef.current = null;
        alert(msg);
      },
    });
  }

  function join(code: string) {
    setJoinStatus("connecting");
    setJoinError("");
    guestRef.current?.destroy();
    guestRef.current = joinRoom(code, {
      onOpen: () => {
        setNet({ mode: "guest", connected: true, code });
        setJoinStatus("connected");
      },
      onState: (state) => setGame(state),
      onClose: () => {
        setNet(SOLO);
        setJoinStatus("idle");
      },
      onError: (msg) => {
        setJoinStatus("error");
        setJoinError(msg);
      },
    });
  }

  // Effect to handle Team Leader B auto-registration on join
  useEffect(() => {
    if (net.mode === "guest" && game.stage === "lobby" && !game.teamB.captain) {
      // Prompt for name if not set
      const name = prompt("Enter your name (must be in player pool):");
      if (name) {
        guestRef.current?.send({ type: "setLeaderName", name });
      }
    }
  }, [net.mode, game.stage, game.teamB.captain]);

  const sendOrApply = (action: GuestAction, localFn: (s: GameState) => GameState) => {
    if (netRef.current.mode === "guest") {
      guestRef.current?.send(action);
    } else {
      setGame(localFn);
    }
  };

  const doDraftPick = (player: string) =>
    sendOrApply({ type: "draftPick", player }, (s) => pickPlayer(s, player));

  const doVetoAct = (map: string) =>
    sendOrApply({ type: "vetoAct", map }, (s) => vetoAct(s, map));

  const doVetoSide = (side: TeamId) =>
    sendOrApply({ type: "vetoSide", side }, (s) => vetoChooseSide(s, side));

  const doCoinFlip = () =>
    sendOrApply({ type: "coinflip" }, (s) => flipCoin(s));

  const doDeciderFlip = () =>
    sendOrApply({ type: "deciderFlip" }, (s) => deciderFlip(s));

  const isHostOrSolo = net.mode !== "guest";
  const hostCanCoverForGuest = net.mode === "host" && !net.connected;
  const canActAs = (team: TeamId) =>
    me === null || me === team || (net.mode === "host" && hostCanCoverForGuest);

  const draftPickAllowed = !draftComplete(game) && canActAs(game.currentTurn);
  const vetoSteps = buildVetoSteps(game.format, game.startingTeam);

  const titles: Record<Stage, { title: string; subtitle?: string }> = {
    pool: { title: "DRAFT HUB", subtitle: "Join or Create Session" },
    room: { title: "CREATE ROOM", subtitle: "Assign Team Leader A" },
    lobby: { title: "ROOM LOBBY", subtitle: "Waiting for Team Captains" },
    draft: { title: "TEAM DRAFT", subtitle: "Pick your Teammates" },
    format: { title: "MATCH FORMAT", subtitle: "Choose Veto Style" },
    coinflip: { title: "COIN FLIP", subtitle: "Be last, Be Unlucky:(" },
    veto: { title: "MAP VETO", subtitle: "Pick & Ban" },
    side_selection: { title: "SIDE SELECTION", subtitle: "T or CT" },
    summary: { title: "MATCH SUMMARY", subtitle: "Rosters & Maps" },
  };

  const stageContent: Record<Stage, ReactNode> = {
    pool: (
      <PlayerPool
        players={game.pool}
        readOnly={net.mode === "guest"}
        joinStatus={joinStatus}
        joinError={joinError}
        onAdd={(name) => setGame((s) => addPlayer(s, name))}
        onRemove={(name) => setGame((s) => removePlayer(s, name))}
        onContinue={() => setGame((s) => goToStage(s, "room"))}
        onJoin={join}
      />
    ),
    room: (
      <CreateRoom
        players={game.pool}
        readOnly={net.mode === "guest"}
        onCreate={(a) => setGame((s) => createRoom(s, a))}
        onBack={() => setGame((s) => goToStage(s, "pool"))}
      />
    ),
    lobby: (
      <Lobby
        game={game}
        isGuest={net.mode === "guest"}
        hostActive={hostActive && net.mode === "host"}
        code={net.mode === "host" || net.mode === "guest" ? net.code : null}
        connected={net.mode === "host" && net.connected}
        onGoSolo={() => setGame((s) => goToStage(s, "draft"))}
        onHostOnline={openHostRoom}
        onContinue={() => setGame((s) => goToStage(s, "draft"))}
      />
    ),
    draft: (
      <DraftBoard
        teamA={game.teamA}
        teamB={game.teamB}
        pool={game.pool}
        currentTurn={game.currentTurn}
        canPick={draftPickAllowed}
        canContinue={isHostOrSolo}
        onPick={doDraftPick}
        onContinue={() => setGame((s) => goToStage(s, "format"))}
      />
    ),
    format: (
      <FormatSelect
        enabled={isHostOrSolo}
        onSelect={(f: MatchFormat) => setGame((s) => selectFormat(s, f))}
      />
    ),
    coinflip: (
      <CoinFlip
        teamA={game.teamA}
        teamB={game.teamB}
        winner={game.coinWinner}
        canFlip={isHostOrSolo || net.mode === "guest"}
        canContinue={isHostOrSolo}
        onFlip={doCoinFlip}
        onContinue={() => setGame((s) => goToStage(s, "veto"))}
      />
    ),
    veto: (
      <MapVeto
        teamA={game.teamA}
        teamB={game.teamB}
        veto={game.veto}
        log={game.log}
        steps={vetoSteps}
        myTeam={hostCanCoverForGuest ? null : me}
        canAdvance={isHostOrSolo}
        onMapClick={doVetoAct}
        onSideChoice={doVetoSide}
        onDeciderFlip={doDeciderFlip}
        onContinue={() => setGame((s) => goToStage(s, "summary"))}
      />
    ),
    side_selection: <div />, // handled within MapVeto popups but needed for Stage type
    summary: (
      <MatchSummary
        teamA={game.teamA}
        teamB={game.teamB}
        format={game.format}
        maps={game.veto.maps}
        vetoLog={game.log}
        canRestart={isHostOrSolo}
        onRestart={() => setGame((s) => restart(s))}
      />
    ),
  };

  return (
    <>
      <NetBadge net={net} />
      <StageShell stage={game.stage} title={titles[game.stage].title} subtitle={titles[game.stage].subtitle}>
        {stageContent[game.stage]}
      </StageShell>
    </>
  );
}

function NetBadge({ net }: { net: Net }) {
  if (net.mode === "solo") return null;
  const connected = net.connected;
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[#333333] bg-[#1f1f1f] px-4 py-2 text-[9px] font-black shadow-md`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[#FF5500]" : "animate-pulse bg-[#a0a0a0]"}`} />
      <span className="text-white">{net.mode === "host" ? "HOST" : "GUEST"} · {net.code}</span>
    </div>
  );
}
