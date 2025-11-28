import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Gamepad2, Users, Download } from "lucide-react";

export default function Menu() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto text-center">
        <h1 data-testid="text-title" className="text-4xl sm:text-5xl font-bold mb-4">
          Game Hub
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          Choose a game to play
        </p>

        <div className="flex flex-col gap-4">
          <Button
            data-testid="button-tournament"
            onClick={() => setLocation("/tournament")}
            size="lg"
            className="h-16 text-lg bg-gradient-to-r from-primary to-primary/80"
          >
            <Users className="w-5 h-5 mr-2" />
            Multiplayer Tournament
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">Single Player</span>
            </div>
          </div>

          <Button
            data-testid="button-tictactoe"
            onClick={() => setLocation("/tictactoe")}
            size="lg"
            className="h-16 text-lg"
            variant="outline"
          >
            <Gamepad2 className="w-5 h-5 mr-2" />
            Tic-Tac-Toe
          </Button>
          <Button
            data-testid="button-flappybird"
            onClick={() => setLocation("/flappybird")}
            size="lg"
            className="h-16 text-lg"
            variant="outline"
          >
            <Gamepad2 className="w-5 h-5 mr-2" />
            Flappy Bird
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-16 text-lg"
            onClick={() => window.location.href = '/api/download'}
          >
            <Download className="w-5 h-5 mr-2" />
            Download Project
          </Button>
        </div>
      </div>
    </div>
  );
}