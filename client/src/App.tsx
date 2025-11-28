import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Game from "@/pages/game";
import FlappyBird from "@/pages/flappy-bird";
import Menu from "@/pages/menu";
import TournamentLobby from "@/pages/tournament-lobby";
import MultiplayerTicTacToe from "@/pages/multiplayer-tictactoe";
import MultiplayerFlappy from "@/pages/multiplayer-flappy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Menu} />
      <Route path="/tictactoe" component={Game} />
      <Route path="/flappybird" component={FlappyBird} />
      <Route path="/tournament" component={TournamentLobby} />
      <Route path="/mp-tictactoe/:roomId/:playerId" component={MultiplayerTicTacToe} />
      <Route path="/mp-flappy/:roomId/:playerId" component={MultiplayerFlappy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
