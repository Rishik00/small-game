import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, X, Circle } from "lucide-react";
import { gameWs } from "@/lib/ws";

const WINNING_COMBINATIONS = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
];

function checkWinner(board: (string | null)[]): { winner: string | null; line: number[] | null } {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c, d] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

export default function MultiplayerTicTacToe() {
  const { roomId, playerId } = useParams<{ roomId: string; playerId: string }>();
  const [, setLocation] = useLocation();
  const [board, setBoard] = useState<(string | null)[]>(Array(16).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [gameStatus, setGameStatus] = useState<"playing" | "finished">("playing");
  const [winner, setWinner] = useState<string | null>(null);
  const [otherPlayerName, setOtherPlayerName] = useState("Opponent");
  const [playerSymbol, setPlayerSymbol] = useState("X");

  useEffect(() => {
    gameWs.on("player_joined", (data) => {
      const other = data.players.find((p: any) => p.id !== playerId);
      if (other) {
        setOtherPlayerName(other.name);
        setPlayerSymbol("X");
      }
    });

    gameWs.on("move", (data) => {
      setBoard((prev) => {
        const newBoard = [...prev];
        newBoard[data.data.index] = data.player_id === playerId ? playerSymbol : playerSymbol === "X" ? "O" : "X";
        const { winner: w } = checkWinner(newBoard);
        if (w) {
          setWinner(w);
          setGameStatus("finished");
        }
        setCurrentPlayer(playerSymbol === "X" ? "O" : "X");
        return newBoard;
      });
    });

    return () => {
      gameWs.close();
    };
  }, [playerId, playerSymbol]);

  const handleCellClick = (index: number) => {
    if (board[index] || gameStatus === "finished" || currentPlayer !== playerSymbol) return;

    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    setBoard(newBoard);

    gameWs.send({
      type: "game_move",
      data: { index },
    });

    const { winner: w } = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setGameStatus("finished");
    } else {
      setCurrentPlayer(playerSymbol === "X" ? "O" : "X");
    }
  };

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
            Multiplayer Tic-Tac-Toe
          </h1>
          <div className="w-12" />
        </div>

        <div className="flex justify-center gap-8 mb-6 text-center">
          <div className={`${currentPlayer === playerSymbol ? "opacity-100" : "opacity-50"}`}>
            <p className="text-sm text-muted-foreground">You</p>
            <p className="text-2xl font-bold">{playerSymbol}</p>
          </div>
          <div className={`${currentPlayer !== playerSymbol ? "opacity-100" : "opacity-50"}`}>
            <p className="text-sm text-muted-foreground">{otherPlayerName}</p>
            <p className="text-2xl font-bold">{playerSymbol === "X" ? "O" : "X"}</p>
          </div>
        </div>

        {winner && (
          <div className="text-center mb-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-lg font-bold">{winner === playerSymbol ? "You Win! 🎉" : `${otherPlayerName} Wins`}</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-6">
          {board.map((cell, idx) => (
            <button
              key={idx}
              data-testid={`cell-${idx}`}
              onClick={() => handleCellClick(idx)}
              disabled={gameStatus === "finished" || currentPlayer !== playerSymbol}
              className="aspect-square bg-card border border-card-border rounded-lg flex items-center justify-center hover-elevate cursor-pointer disabled:opacity-50"
            >
              {cell === "X" && <X className="w-6 h-6 text-primary" />}
              {cell === "O" && <Circle className="w-6 h-6 text-destructive" />}
            </button>
          ))}
        </div>

        {gameStatus === "finished" && (
          <Button
            data-testid="button-back-lobby"
            onClick={() => {
              gameWs.send({ type: "leave" });
              setLocation("/tournament");
            }}
            className="w-full"
          >
            Back to Lobby
          </Button>
        )}
      </div>
    </div>
  );
}
