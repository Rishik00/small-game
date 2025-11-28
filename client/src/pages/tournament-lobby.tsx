import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ChevronLeft, Copy, Check } from "lucide-react";
import { gameWs } from "@/lib/ws";

type GameType = "tictactoe" | "flappybird";

export default function TournamentLobby() {
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [gameType, setGameType] = useState<GameType>("tictactoe");
  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [otherPlayer, setOtherPlayer] = useState<{ id: string; name: string } | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gameWs.connect().then(() => {
      gameWs.on("room_created", (data) => {
        setRoomId(data.room_id);
        setPlayerId(data.player_id);
      });

      gameWs.on("rooms_list", (data) => {
        setRooms(data.rooms);
      });

      gameWs.on("player_joined", (data) => {
        if (data.players.length === 2) {
          setOtherPlayer(data.players.find((p: any) => p.id !== playerId));
        }
      });

      gameWs.on("game_start", () => {
        setTimeout(() => {
          if (gameType === "tictactoe") {
            setLocation(`/mp-tictactoe/${roomId}/${playerId}`);
          } else {
            setLocation(`/mp-flappy/${roomId}/${playerId}`);
          }
        }, 500);
      });

      refreshRooms();
    });

    return () => {
      gameWs.close();
    };
  }, []);

  const refreshRooms = () => {
    gameWs.send({ type: "list_rooms" });
  };

  const createRoom = () => {
    if (!playerName.trim()) return;
    setLoading(true);
    gameWs.send({
      type: "create_room",
      game_type: gameType,
      player_name: playerName,
    });
  };

  const joinRoom = (roomToJoin: any) => {
    if (!playerName.trim()) return;
    setLoading(true);
    setGameType(roomToJoin.game_type);
    gameWs.send({
      type: "join",
      room_id: roomToJoin.id,
      player_name: playerName,
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (roomId && !otherPlayer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              data-testid="button-back"
              onClick={() => {
                gameWs.send({ type: "leave" });
                setLocation("/");
              }}
              variant="ghost"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 data-testid="text-title" className="text-2xl font-bold">
              Tournament Room
            </h1>
            <div className="w-12" />
          </div>

          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Game Type: {gameType === "tictactoe" ? "Tic-Tac-Toe" : "Flappy Bird"}</p>
            <p className="text-sm text-muted-foreground mb-4">Your Name: {playerName}</p>
            
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="text-xs text-muted-foreground mb-2">Room ID</p>
              <div className="flex gap-2 items-center justify-center">
                <code data-testid="text-room-id" className="font-mono text-lg font-bold">
                  {roomId}
                </code>
                <Button
                  data-testid="button-copy-room"
                  onClick={copyRoomId}
                  size="icon"
                  variant="ghost"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-lg font-semibold">Waiting for opponent...</p>
            <div className="mt-4">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            data-testid="button-back"
            onClick={() => setLocation("/")}
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 data-testid="text-title" className="text-2xl font-bold">
            Tournament
          </h1>
          <div className="w-12" />
        </div>

        <div className="mb-6 space-y-4">
          <Input
            data-testid="input-player-name"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={loading}
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              data-testid="button-game-tictactoe"
              variant={gameType === "tictactoe" ? "default" : "outline"}
              onClick={() => setGameType("tictactoe")}
              disabled={loading}
            >
              Tic-Tac-Toe
            </Button>
            <Button
              data-testid="button-game-flappy"
              variant={gameType === "flappybird" ? "default" : "outline"}
              onClick={() => setGameType("flappybird")}
              disabled={loading}
            >
              Flappy Bird
            </Button>
          </div>

          <Button
            data-testid="button-create-room"
            onClick={createRoom}
            size="lg"
            disabled={!playerName.trim() || loading}
            className="w-full"
          >
            Create Room
          </Button>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-3">Available Rooms</h2>
          <Button
            data-testid="button-refresh"
            onClick={refreshRooms}
            variant="outline"
            size="sm"
            className="w-full mb-3"
          >
            Refresh
          </Button>

          {rooms.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No rooms available</p>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <Card key={room.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{room.game_type === "tictactoe" ? "Tic-Tac-Toe" : "Flappy Bird"}</p>
                      <p className="text-xs text-muted-foreground">Host: {room.host}</p>
                    </div>
                    <Button
                      data-testid={`button-join-room-${room.id}`}
                      onClick={() => joinRoom(room)}
                      size="sm"
                      disabled={!playerName.trim() || loading}
                    >
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
