import { useState } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import type { Game, Player } from '@/hooks/useGame';

interface CluePhaseScreenProps {
  game: Game;
  players: Player[];
  currentPlayer: Player;
  onSubmitClue: (clue: string) => void;
}

export default function CluePhaseScreen({ game, players, currentPlayer, onSubmitClue }: CluePhaseScreenProps) {
  const [clue, setClue] = useState('');
  const sortedPlayers = [...players].sort((a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0));
  const activePlayer = sortedPlayers[game.current_turn_index];
  const isMyTurn = activePlayer?.id === currentPlayer.id;
  const hasSubmitted = !!currentPlayer.clue;

  const handleSubmit = () => {
    if (!clue.trim()) return;
    onSubmitClue(clue.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
        <div className="text-center space-y-1">
          <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
          <h2 className="text-xl font-bold">Clue Round</h2>
          <p className="text-xs text-muted-foreground">Give a one-word clue about the secret word</p>
        </div>

        {/* Turn list */}
        <div className="space-y-1.5">
          {sortedPlayers.map((player, i) => {
            const isActive = i === game.current_turn_index && !player.clue;
            const isDone = !!player.clue;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/10 border-primary/30 animate-pulse-ring'
                    : isDone
                    ? 'bg-secondary/40 border-border/30'
                    : 'bg-secondary/20 border-border/20'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-game-success/20 text-game-success' : 'bg-secondary text-muted-foreground'
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium flex-1 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {player.name}
                  {player.id === currentPlayer.id && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </span>
                {isDone && (
                  <span className="text-sm font-mono font-medium text-foreground">"{player.clue}"</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Input for current turn */}
        {isMyTurn && !hasSubmitted && (
          <div className="space-y-3 animate-scale-in">
            <p className="text-center text-sm font-semibold text-primary">It's your turn!</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={clue}
                onChange={(e) => setClue(e.target.value.replace(/\s/g, ''))}
                placeholder="One word only"
                maxLength={30}
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base font-mono"
              />
              <button
                onClick={handleSubmit}
                disabled={!clue.trim()}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {hasSubmitted && (
          <p className="text-center text-sm text-muted-foreground">
            You said: <span className="font-mono font-medium text-foreground">"{currentPlayer.clue}"</span>
          </p>
        )}

        {!isMyTurn && !hasSubmitted && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Waiting for {activePlayer?.name} to give a clue...
          </p>
        )}
      </div>
    </div>
  );
}
