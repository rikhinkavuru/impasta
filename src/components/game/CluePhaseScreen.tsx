import { useState, useEffect } from 'react';
import { MessageCircle, Check, ArrowRight } from 'lucide-react';
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
  
  const totalTurns = (game.clue_rounds || 1) * players.length;
  const currentTurn = game.current_turn_index || 0;
  const currentRound = Math.floor(currentTurn / players.length) + 1;
  const turnInRound = currentTurn % players.length;
  
  const activePlayer = sortedPlayers[turnInRound];
  const isMyTurn = activePlayer?.id === currentPlayer.id;
  const hasSubmittedThisTurn = !!currentPlayer.clue;

  // Clear local input when turn changes
  useEffect(() => {
    setClue('');
  }, [currentTurn]);

  const handleSubmit = () => {
    if (!clue.trim()) return;
    onSubmitClue(clue.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-background pt-16">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">
        
        <div className="text-center space-y-4">
          <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">
            Clue Round {currentRound} / {game.clue_rounds || 1}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {isMyTurn ? 'IT\'S YOUR TURN' : `WAITING FOR ${activePlayer?.name.toUpperCase()}`}
          </h2>
          <p className="text-xs font-medium text-muted-foreground/60">One word only. Be subtle.</p>
        </div>

        {/* Turn list */}
        <div className="space-y-3">
          {sortedPlayers.map((player, i) => {
            const isActive = i === turnInRound;
            const isDone = i < turnInRound || (i === turnInRound && !!player.clue);
            
            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all duration-500 ${
                  isActive
                    ? 'bg-primary text-primary-foreground accent-glow scale-[1.02]'
                    : isDone
                    ? 'bg-white premium-shadow border border-border/30 opacity-60'
                    : 'bg-white/40 border border-border/20'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  isActive ? 'bg-white text-primary' : isDone ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                
                <div className="flex-1">
                  <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {player.name}
                    {player.id === currentPlayer.id && <span className="ml-2 text-[10px] opacity-60 uppercase">you</span>}
                  </span>
                </div>

                {player.clue && (
                  <span className="text-sm font-extrabold tracking-tight text-foreground uppercase">
                    "{player.clue}"
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Input for current turn */}
        {isMyTurn && !hasSubmittedThisTurn && (
          <div className="space-y-6 animate-scale-in p-8 rounded-[3rem] bg-white premium-shadow border border-border/50">
            <div className="space-y-4">
              <label className="block text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Your Clue</label>
              <input
                type="text"
                value={clue}
                onChange={(e) => setClue(e.target.value.replace(/\s/g, ''))}
                placeholder="TYPE WORD..."
                maxLength={30}
                autoFocus
                className="w-full luxury-input text-3xl font-extrabold tracking-tighter"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!clue.trim()}
              className="w-full pill-button bg-primary text-primary-foreground accent-glow flex items-center justify-center gap-2"
            >
              SEND CLUE
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {hasSubmittedThisTurn && !isMyTurn && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
