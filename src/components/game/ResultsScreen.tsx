import { Trophy, Skull, RotateCcw } from 'lucide-react';
import type { Game, Player } from '@/hooks/useGame';

interface ResultsScreenProps {
  game: Game;
  players: Player[];
  currentPlayer: Player;
  isHost: boolean;
  onPlayAgain: () => void;
}

export default function ResultsScreen({ game, players, currentPlayer, isHost, onPlayAgain }: ResultsScreenProps) {
  const imposter = players.find(p => p.is_imposter);
  
  // Count votes
  const voteCounts: Record<string, number> = {};
  players.forEach(p => {
    if (p.vote_for) {
      voteCounts[p.vote_for] = (voteCounts[p.vote_for] || 0) + 1;
    }
  });

  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  const mostVotedId = Object.entries(voteCounts).find(([_, v]) => v === maxVotes)?.[0];
  const imposterCaught = mostVotedId === imposter?.id;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-scale-in">
        {/* Result banner */}
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${
            imposterCaught ? 'bg-game-success/15' : 'bg-game-danger/15'
          }`}>
            {imposterCaught 
              ? <Trophy className="w-10 h-10 text-game-success" />
              : <Skull className="w-10 h-10 text-game-danger" />
            }
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${imposterCaught ? 'text-game-success' : 'text-game-danger'}`}>
              {imposterCaught ? 'Civilians Win!' : 'Imposter Wins!'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {imposterCaught
                ? `${imposter?.name} was caught!`
                : `${imposter?.name} got away with it!`
              }
            </p>
          </div>
        </div>

        {/* Word reveal */}
        <div className="px-5 py-4 rounded-2xl bg-secondary/60 border border-border/50 text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">The word was</p>
          <p className="text-xl font-bold">{game.word}</p>
          <p className="text-xs text-muted-foreground">Imposter's clue: "{game.imposter_clue}"</p>
        </div>

        {/* Vote breakdown */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vote Results</p>
          {players.map((player) => {
            const votes = voteCounts[player.id] || 0;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  player.is_imposter
                    ? 'bg-game-danger/10 border-game-danger/20'
                    : 'bg-secondary/40 border-border/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  player.is_imposter ? 'bg-game-danger/20 text-game-danger' : 'bg-primary/10 text-primary'
                }`}>
                  {player.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {player.name}
                    {player.is_imposter && (
                      <span className="ml-1.5 text-[10px] font-bold text-game-danger uppercase">Imposter</span>
                    )}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">"{player.clue}"</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${votes === maxVotes && votes > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
                  {votes} vote{votes !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {isHost && (
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.97] transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
