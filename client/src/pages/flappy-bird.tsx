import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";

type GameState = "menu" | "playing" | "gameover";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PIPE_WIDTH = 80;
const PIPE_GAP = 120;
const PIPE_SPEED = 5;
const GRAVITY = 0.6;
const JUMP_STRENGTH = -11;
const BIRD_SIZE = 24;

interface Bird {
  x: number;
  y: number;
  size: number;
  velocity: number;
}

interface Pipe {
  x: number;
  topHeight: number;
}

export default function FlappyBird() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("flappyBirdHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const birdRef = useRef<Bird>({
    x: 60,
    y: CANVAS_HEIGHT / 2,
    size: BIRD_SIZE,
    velocity: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<GameState>("menu");
  const animationRef = useRef<number>();

  const resetGame = () => {
    birdRef.current = {
      x: 60,
      y: CANVAS_HEIGHT / 2,
      size: BIRD_SIZE,
      velocity: 0,
    };
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    gameStateRef.current = "playing";
    setGameState("playing");
  };

  const jump = () => {
    if (gameStateRef.current === "playing") {
      birdRef.current.velocity = JUMP_STRENGTH;
    } else if (gameStateRef.current === "gameover") {
      resetGame();
    } else if (gameStateRef.current === "menu") {
      resetGame();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pipeCounter = 0;

    const gameLoop = () => {
      // Update bird
      if (gameStateRef.current === "playing") {
        birdRef.current.velocity += GRAVITY;
        birdRef.current.y += birdRef.current.velocity;

        // Check bounds
        if (
          birdRef.current.y + birdRef.current.size > CANVAS_HEIGHT ||
          birdRef.current.y < 0
        ) {
          gameStateRef.current = "gameover";
          setGameState("gameover");
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem(
              "flappyBirdHighScore",
              scoreRef.current.toString()
            );
          }
        }

        // Generate pipes
        pipeCounter++;
        if (pipeCounter > 90) {
          const gapStart = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 80) + 40;
          pipesRef.current.push({
            x: CANVAS_WIDTH,
            topHeight: gapStart,
          });
          pipeCounter = 0;
        }

        // Update pipes
        pipesRef.current = pipesRef.current.filter((pipe) => pipe.x > -PIPE_WIDTH);
        pipesRef.current.forEach((pipe) => {
          pipe.x -= PIPE_SPEED;

          // Collision detection
          const bird = birdRef.current;
          if (
            bird.x < pipe.x + PIPE_WIDTH &&
            bird.x + bird.size > pipe.x
          ) {
            if (
              bird.y < pipe.topHeight ||
              bird.y + bird.size > pipe.topHeight + PIPE_GAP
            ) {
              gameStateRef.current = "gameover";
              setGameState("gameover");
              if (scoreRef.current > highScore) {
                setHighScore(scoreRef.current);
                localStorage.setItem(
                  "flappyBirdHighScore",
                  scoreRef.current.toString()
                );
              }
            }
          }

          // Score
          if (pipe.x === bird.x) {
            scoreRef.current++;
            setScore(scoreRef.current);
          }
        });
      }

      // Draw gradient background (sky blue to lighter)
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, "#4FD0E7");
      gradient.addColorStop(1, "#87CEEB");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw ground
      ctx.fillStyle = "#DAA520";
      ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);

      // Draw bird - yellow circle with white eye
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        birdRef.current.x,
        birdRef.current.y,
        birdRef.current.size,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Bird eye
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(
        birdRef.current.x + 8,
        birdRef.current.y - 6,
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Bird pupil
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(
        birdRef.current.x + 9,
        birdRef.current.y - 6,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw pipes with green and red appearance
      pipesRef.current.forEach((pipe) => {
        // Pipe cap (red)
        ctx.fillStyle = "#D32F2F";
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 8, PIPE_WIDTH + 10, 8);
        
        // Top pipe (green)
        ctx.fillStyle = "#228B22";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Pipe cap bottom (red)
        ctx.fillStyle = "#D32F2F";
        ctx.fillRect(
          pipe.x - 5,
          pipe.topHeight + PIPE_GAP,
          PIPE_WIDTH + 10,
          8
        );
        
        // Bottom pipe (green)
        ctx.fillStyle = "#228B22";
        ctx.fillRect(
          pipe.x,
          pipe.topHeight + PIPE_GAP + 8,
          PIPE_WIDTH,
          CANVAS_HEIGHT - (pipe.topHeight + PIPE_GAP + 8)
        );
      });

      // Draw score
      ctx.fillStyle = "#000";
      ctx.font = "24px Arial";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 40);

      if (gameStateRef.current === "gameover") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.font = "24px Arial";
        ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        ctx.textAlign = "left";
      } else if (gameStateRef.current === "menu") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Flappy Bird", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
        ctx.font = "24px Arial";
        ctx.fillText("Press SPACE or click to play", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        ctx.textAlign = "left";
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [highScore]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            data-testid="button-back-menu"
            onClick={() => setLocation("/")}
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Menu
          </Button>
          <h1 data-testid="text-title" className="text-2xl sm:text-3xl font-bold text-center">
            Flappy Bird
          </h1>
          <div className="w-16" />
        </div>

        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={jump}
            data-testid="canvas-game"
            className="border-4 border-primary rounded-lg cursor-pointer shadow-lg"
          />
        </div>

        <div className="flex justify-center gap-3">
          <Button
            data-testid="button-new-game"
            onClick={resetGame}
            size="lg"
            className="px-8"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </div>
    </div>
  );
}
