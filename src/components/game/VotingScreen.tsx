import { useState } from 'react';
import { Vote, Check } from 'lucide-react';
import type { Game, Player } from '@/hooks/useGame';

interface VotingScreenProps {
  game: Game;
  players: Player[];
  currentPlayer: Player;
  onVote: (playerId: string) => void;
}

export default function VotingScreen({ game, players, currentPlayer, onVote }: VotingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const hasVoted = !!currentPlayer.vote_for;

  const handleVote = () => {
    if (!selectedId) return;
    onVote(selectedId);
  };

  const votedCount = players.filter(p => p.vote_for).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
        <div className="text-center space-y-1">
          <Vote className="w-6 h-6 text-accent mx-auto mb-2" />
          <h2 className="text-xl font-bold">Vote</h2>
          <p className="text-xs text-muted-foreground">Who do you think is the imposter?</p>
        </div>

        {/* Clues recap */}
        <div className="space-y-1.5">
          {players.map((player) => (
            <button
              key={player.id}
              disabled={hasVoted || player.id === currentPlayer.id}
              onClick={() => setSelectedId(player.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
                hasVoted && currentPlayer.vote_for === player.id
                  ? 'bg-accent/10 border-accent/30'
                  : selectedId === player.id
                  ? 'bg-primary/10 border-primary/30'
                  : player.id === currentPlayer.id
                  ? 'bg-secondary/20 border-border/20 opacity-50'
                  : 'bg-secondary/40 border-border/30 hover:border-primary/20'
              } ${!hasVoted && player.id !== currentPlayer.id ? 'active:scale-[0.97]' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {player.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {player.name}
                  {player.id === currentPlayer.id && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </p>
                <p className="text-xs font-mono text-muted-foreground">"{player.clue}"</p>
              </div>
              {selectedId === player.id && !hasVoted && (
                <Check className="w-5 h-5 text-primary" />
              )}
              {hasVoted && currentPlayer.vote_for === player.id && (
                <Check className="w-5 h-5 text-accent" />
              )}
            </button>
          ))}
        </div>

        {!hasVoted && (
          <button
            onClick={handleVote}
            disabled={!selectedId}
            className="w-full px-5 py-4 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform"
          >
            Cast Vote
          </button>
        )}

        {hasVoted && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Voted! Waiting for others... ({votedCount}/{players.length})
          </p>
        )}
      </div>
    </div>
  );
}
