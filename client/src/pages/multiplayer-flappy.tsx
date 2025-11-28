import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { gameWs } from "@/lib/ws";

const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 300;

export default function MultiplayerFlappy() {
  const { roomId, playerId } = useParams<{ roomId: string; playerId: string }>();
  const [, setLocation] = useLocation();
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement }>({});
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [otherPlayerName, setOtherPlayerName] = useState("Opponent");
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    gameWs.on("player_joined", (data) => {
      const other = data.players.find((p: any) => p.id !== playerId);
      if (other) {
        setOtherPlayerName(other.name);
      }
    });

    gameWs.on("action", (data) => {
      if (data.action === "score_update") {
        setScores((prev) => ({ ...prev, [data.player_id]: data.data.score }));
      } else if (data.action === "game_over") {
        setGameOver(true);
      }
    });

    return () => {
      gameWs.close();
    };
  }, [playerId]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
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
            Multiplayer Flappy Bird
          </h1>
          <div className="w-12" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h2 className="font-bold mb-2">You</h2>
            <p className="text-3xl font-bold mb-2">{scores[playerId] || 0}</p>
            <canvas
              ref={(el) => {
                if (el) canvasRefs.current[playerId] = el;
              }}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border-2 border-primary rounded-lg w-full"
              data-testid="canvas-your-game"
            />
          </div>

          <div className="text-center">
            <h2 className="font-bold mb-2">{otherPlayerName}</h2>
            <p className="text-3xl font-bold mb-2">{Object.values(scores).find((_, idx) => idx === 1) || 0}</p>
            <canvas
              ref={(el) => {
                if (el) canvasRefs.current["opponent"] = el;
              }}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border-2 border-destructive rounded-lg w-full"
              data-testid="canvas-opponent-game"
            />
          </div>
        </div>

        {gameOver && (
          <div className="mt-6 text-center">
            <p className="text-lg font-bold mb-4">Game Over!</p>
            <Button
              data-testid="button-back-lobby"
              onClick={() => {
                gameWs.send({ type: "leave" });
                setLocation("/tournament");
              }}
            >
              Back to Lobby
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
