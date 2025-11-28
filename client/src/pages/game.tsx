import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RotateCcw, X, Circle, Users, Bot, ChevronLeft, Pencil, Volume2, VolumeX, Gamepad2 } from "lucide-react";
import { useLocation } from "wouter";
import { playMoveSound, playWinSound, playDrawSound, playClickSound } from "@/lib/sounds";

type Player = "X" | "O";
type CellValue = Player | null;
type Board = CellValue[];
type GameStatus = "playing" | "won" | "draw";
type GameMode = "menu" | "pvp" | "pve";
type Difficulty = "easy" | "medium" | "hard";

const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  // Columns
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  // Diagonals
  [0, 5, 10, 15], [3, 6, 9, 12],
];

function checkWinner(board: Board): { winner: Player | null; winningLine: number[] | null } {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c, d] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]) {
      return { winner: board[a], winningLine: combination };
    }
  }
  return { winner: null, winningLine: null };
}

function checkDraw(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

function getEmptyCells(board: Board): number[] {
  return board.map((cell, index) => (cell === null ? index : -1)).filter((i) => i !== -1);
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  maxDepth: number = 4
): number {
  const { winner } = checkWinner(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (checkDraw(board)) return 0;
  if (depth >= maxDepth) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const cell of getEmptyCells(board)) {
      const newBoard = [...board];
      newBoard[cell] = "O";
      const evaluation = minimax(newBoard, depth + 1, false, alpha, beta, maxDepth);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const cell of getEmptyCells(board)) {
      const newBoard = [...board];
      newBoard[cell] = "X";
      const evaluation = minimax(newBoard, depth + 1, true, alpha, beta, maxDepth);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestMove(board: Board, maxDepth: number = 4): number {
  let bestMove = -1;
  let bestValue = -Infinity;

  for (const cell of getEmptyCells(board)) {
    const newBoard = [...board];
    newBoard[cell] = "O";
    const moveValue = minimax(newBoard, 0, false, -Infinity, Infinity, maxDepth);
    if (moveValue > bestValue) {
      bestValue = moveValue;
      bestMove = cell;
    }
  }
  return bestMove;
}

function getRandomMove(board: Board): number {
  const emptyCells = getEmptyCells(board);
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getMediumMove(board: Board): number {
  if (Math.random() < 0.6) {
    return getBestMove(board, 3);
  }
  return getRandomMove(board);
}

function getAIMove(board: Board, difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return getRandomMove(board);
    case "medium":
      return getMediumMove(board);
    case "hard":
      return getBestMove(board, 4);
  }
}

interface CellProps {
  value: CellValue;
  onClick: () => void;
  isWinningCell: boolean;
  disabled: boolean;
  index: number;
  isNew: boolean;
}

function Cell({ value, onClick, isWinningCell, disabled, index, isNew }: CellProps) {
  return (
    <button
      data-testid={`cell-${index}`}
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        aspect-square w-full
        flex items-center justify-center
        bg-card border border-card-border
        rounded-lg
        transition-all duration-200
        ${!disabled && value === null ? "hover-elevate cursor-pointer" : ""}
        ${disabled && value === null ? "cursor-not-allowed opacity-60" : ""}
        ${isWinningCell ? "bg-primary/20 border-primary ring-2 ring-primary/50 animate-win-pulse" : ""}
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
      `}
      aria-label={value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}: empty`}
    >
      {value === "X" && (
        <X 
          className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-primary stroke-[3] transition-all duration-200 ${isWinningCell ? "animate-celebration" : ""} ${isNew ? "animate-pop" : ""}`}
          aria-hidden="true"
        />
      )}
      {value === "O" && (
        <Circle 
          className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-destructive stroke-[3] transition-all duration-200 ${isWinningCell ? "animate-celebration" : ""} ${isNew ? "animate-pop" : ""}`}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

interface ScoreCardProps {
  label: string;
  player: Player;
  score: number;
  isCurrentTurn: boolean;
  gameStatus: GameStatus;
  isAI?: boolean;
  onNameChange?: (name: string) => void;
  editable?: boolean;
}

function ScoreCard({ label, player, score, isCurrentTurn, gameStatus, isAI, onNameChange, editable }: ScoreCardProps) {
  const isActive = gameStatus === "playing" && isCurrentTurn;
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(label);
  }, [label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newName = tempName.trim() || (player === "X" ? "Player X" : "Player O");
    onNameChange?.(newName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setTempName(label);
      setIsEditing(false);
    }
  };
  
  return (
    <Card
      data-testid={`score-${player.toLowerCase()}`}
      className={`
        flex flex-col items-center justify-center p-4 min-w-[100px]
        transition-all duration-300
        ${isActive ? "ring-2 ring-offset-2 ring-offset-background" : ""}
        ${isActive && player === "X" ? "ring-primary" : ""}
        ${isActive && player === "O" ? "ring-destructive" : ""}
      `}
    >
      <div className="flex items-center gap-1 mb-1">
        {player === "X" ? (
          <X className="w-5 h-5 text-primary stroke-[3] flex-shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-destructive stroke-[3] flex-shrink-0" />
        )}
        {isEditing && editable ? (
          <Input
            ref={inputRef}
            data-testid={`input-name-${player.toLowerCase()}`}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-6 w-20 text-xs px-1"
            maxLength={12}
          />
        ) : (
          <button
            data-testid={`button-edit-name-${player.toLowerCase()}`}
            onClick={() => editable && !isAI && setIsEditing(true)}
            className={`flex items-center gap-1 text-sm font-medium text-muted-foreground truncate max-w-[70px] ${editable && !isAI ? "hover:text-foreground cursor-pointer" : ""}`}
            disabled={!editable || isAI}
          >
            {label}{isAI ? " (AI)" : ""}
            {editable && !isAI && <Pencil className="w-3 h-3 opacity-50" />}
          </button>
        )}
      </div>
      <span className="text-3xl font-bold">{score}</span>
    </Card>
  );
}

interface GameMenuProps {
  onSelectMode: (mode: GameMode, difficulty?: Difficulty) => void;
}

function GameMenu({ onSelectMode }: GameMenuProps) {
  const [showDifficulty, setShowDifficulty] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto text-center">
        <h1 
          data-testid="text-title"
          className="text-4xl sm:text-5xl font-bold mb-4"
        >
          Tic-Tac-Toe
        </h1>
        <p className="text-muted-foreground mb-12">Choose your game mode</p>

        {!showDifficulty ? (
          <div className="space-y-4">
            <Button
              data-testid="button-pvp"
              onClick={() => onSelectMode("pvp")}
              size="lg"
              className="w-full max-w-xs h-16 text-lg"
            >
              <Users className="w-6 h-6 mr-3" />
              Player vs Player
            </Button>
            <Button
              data-testid="button-pve"
              onClick={() => setShowDifficulty(true)}
              size="lg"
              variant="outline"
              className="w-full max-w-xs h-16 text-lg"
            >
              <Bot className="w-6 h-6 mr-3" />
              Player vs AI
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              data-testid="button-back"
              onClick={() => setShowDifficulty(false)}
              variant="ghost"
              size="sm"
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <p className="text-lg font-medium mb-6">Select Difficulty</p>
            <div className="space-y-3">
              <Button
                data-testid="button-easy"
                onClick={() => onSelectMode("pve", "easy")}
                size="lg"
                variant="secondary"
                className="w-full max-w-xs h-14"
              >
                Easy
                <span className="ml-2 text-muted-foreground text-sm">(Random moves)</span>
              </Button>
              <Button
                data-testid="button-medium"
                onClick={() => onSelectMode("pve", "medium")}
                size="lg"
                variant="secondary"
                className="w-full max-w-xs h-14"
              >
                Medium
                <span className="ml-2 text-muted-foreground text-sm">(Mixed strategy)</span>
              </Button>
              <Button
                data-testid="button-hard"
                onClick={() => onSelectMode("pve", "hard")}
                size="lg"
                className="w-full max-w-xs h-14"
              >
                Hard
                <span className="ml-2 text-muted-foreground text-sm">(Unbeatable)</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Game() {
  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [board, setBoard] = useState<Board>(Array(16).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [playerXName, setPlayerXName] = useState("Player X");
  const [playerOName, setPlayerOName] = useState("Player O");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<Board>(board);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const handleSelectMode = (mode: GameMode, diff?: Difficulty) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    setBoard(Array(16).fill(null));
    setCurrentPlayer("X");
    setWinningLine(null);
    setGameStatus("playing");
    setLastMove(null);
    setIsAIThinking(false);
  };

  const makeAIMove = useCallback(() => {
    const currentBoard = boardRef.current;
    const aiMove = getAIMove(currentBoard, difficulty);
    
    if (aiMove !== -1 && aiMove !== undefined) {
      const newBoard = [...currentBoard];
      newBoard[aiMove] = "O";
      setBoard(newBoard);
      setLastMove(aiMove);
      if (soundEnabled) playMoveSound();

      const { winner, winningLine: line } = checkWinner(newBoard);
      
      if (winner) {
        setWinningLine(line);
        setGameStatus("won");
        setScores((prev) => ({
          ...prev,
          O: prev.O + 1,
        }));
        if (soundEnabled) setTimeout(playWinSound, 100);
      } else if (checkDraw(newBoard)) {
        setGameStatus("draw");
        setScores((prev) => ({
          ...prev,
          draws: prev.draws + 1,
        }));
        if (soundEnabled) setTimeout(playDrawSound, 100);
      } else {
        setCurrentPlayer("X");
      }
    }
    setIsAIThinking(false);
  }, [difficulty, soundEnabled]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || gameStatus !== "playing" || isAIThinking) return;
    if (gameMode === "pve" && currentPlayer === "O") return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setLastMove(index);
    if (soundEnabled) playMoveSound();

    const { winner, winningLine: line } = checkWinner(newBoard);
    
    if (winner) {
      setWinningLine(line);
      setGameStatus("won");
      setScores((prev) => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + 1,
      }));
      if (soundEnabled) setTimeout(playWinSound, 100);
    } else if (checkDraw(newBoard)) {
      setGameStatus("draw");
      setScores((prev) => ({
        ...prev,
        draws: prev.draws + 1,
      }));
      if (soundEnabled) setTimeout(playDrawSound, 100);
    } else {
      const nextPlayer = currentPlayer === "X" ? "O" : "X";
      setCurrentPlayer(nextPlayer);
      if (gameMode === "pve" && nextPlayer === "O") {
        setIsAIThinking(true);
      }
    }
  }, [board, gameStatus, isAIThinking, gameMode, currentPlayer, soundEnabled]);

  useEffect(() => {
    if (gameMode === "pve" && currentPlayer === "O" && gameStatus === "playing" && isAIThinking) {
      aiTimeoutRef.current = setTimeout(() => {
        makeAIMove();
      }, 500);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [currentPlayer, gameMode, gameStatus, isAIThinking, makeAIMove]);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    setBoard(Array(16).fill(null));
    setCurrentPlayer("X");
    setWinningLine(null);
    setGameStatus("playing");
    setLastMove(null);
    setIsAIThinking(false);
  }, []);

  const resetAll = useCallback(() => {
    resetGame();
    setScores({ X: 0, O: 0, draws: 0 });
  }, [resetGame]);

  const backToMenu = useCallback(() => {
    resetAll();
    setGameMode("menu");
  }, [resetAll]);

  const getPlayerXLabel = () => gameMode === "pve" ? playerXName : playerXName;
  const getPlayerOLabel = () => gameMode === "pve" ? "AI" : playerOName;

  const getStatusMessage = () => {
    if (gameStatus === "won") {
      const winnerLabel = currentPlayer === "X" ? getPlayerXLabel() : getPlayerOLabel();
      return (
        <span className="flex items-center gap-2">
          {winnerLabel} {currentPlayer === "X" ? (
            <X className="w-6 h-6 text-primary stroke-[3] inline" />
          ) : (
            <Circle className="w-5 h-5 text-destructive stroke-[3] inline" />
          )} wins!
        </span>
      );
    }
    if (gameStatus === "draw") {
      return "It's a draw!";
    }
    if (isAIThinking) {
      return (
        <span className="flex items-center gap-2">
          <Circle className="w-5 h-5 text-destructive stroke-[3] animate-pulse" />
          AI is thinking...
        </span>
      );
    }
    const turnLabel = currentPlayer === "X" ? `${getPlayerXLabel()}'s` : `${getPlayerOLabel()}'s`;
    return (
      <span className="flex items-center gap-2">
        {currentPlayer === "X" ? (
          <X className="w-6 h-6 text-primary stroke-[3] inline" />
        ) : (
          <Circle className="w-5 h-5 text-destructive stroke-[3] inline" />
        )}
        <span>{turnLabel} turn</span>
      </span>
    );
  };

  if (gameMode === "menu") {
    return <GameMenu onSelectMode={handleSelectMode} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            data-testid="button-back-menu"
            onClick={backToMenu}
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Menu
          </Button>
          <h1 
            data-testid="text-title"
            className="text-2xl sm:text-3xl font-bold text-center"
          >
            Tic-Tac-Toe
          </h1>
          <Button
            data-testid="button-toggle-sound"
            onClick={() => {
              if (soundEnabled) {
                playClickSound();
                setSoundEnabled(false);
              } else {
                setSoundEnabled(true);
                setTimeout(playClickSound, 50);
              }
            }}
            variant="ghost"
            size="icon"
            aria-label={soundEnabled ? "Mute sounds" : "Unmute sounds"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {gameMode === "pve" && (
          <p data-testid="text-difficulty" className="text-center text-sm text-muted-foreground mb-4">
            Difficulty: <span className="font-medium capitalize">{difficulty}</span>
          </p>
        )}

        <div className="flex justify-center gap-4 mb-6">
          <ScoreCard 
            label={playerXName}
            player="X" 
            score={scores.X} 
            isCurrentTurn={currentPlayer === "X"} 
            gameStatus={gameStatus}
            editable={true}
            onNameChange={setPlayerXName}
          />
          <Card className="flex flex-col items-center justify-center p-4 min-w-[80px]">
            <span className="text-sm font-medium text-muted-foreground mb-1">Draws</span>
            <span data-testid="text-draws" className="text-3xl font-bold">{scores.draws}</span>
          </Card>
          <ScoreCard 
            label={gameMode === "pve" ? "AI" : playerOName}
            player="O" 
            score={scores.O} 
            isCurrentTurn={currentPlayer === "O"} 
            gameStatus={gameStatus}
            isAI={gameMode === "pve"}
            editable={gameMode === "pvp"}
            onNameChange={setPlayerOName}
          />
        </div>

        <div 
          data-testid="text-status"
          className="text-lg sm:text-xl font-semibold text-center mb-6 h-8 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          {getStatusMessage()}
        </div>

        <div 
          className="grid grid-cols-4 gap-2 sm:gap-3 mb-8"
          role="grid"
          aria-label="Tic-Tac-Toe game board"
        >
          {board.map((cell, index) => (
            <Cell
              key={index}
              index={index}
              value={cell}
              onClick={() => handleCellClick(index)}
              isWinningCell={winningLine?.includes(index) ?? false}
              disabled={gameStatus !== "playing" || isAIThinking}
              isNew={lastMove === index}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            data-testid="button-new-game"
            onClick={resetGame}
            size="lg"
            className="px-8"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
          <Button
            data-testid="button-reset-scores"
            onClick={resetAll}
            variant="outline"
            size="lg"
            className="px-8"
          >
            Reset Scores
          </Button>
        </div>
      </div>
    </div>
  );
}
