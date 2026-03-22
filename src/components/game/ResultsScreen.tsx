import { Trophy, Skull, RotateCcw, Medal } from 'lucide-react';
import type { Game, Player, SessionScore } from '@/hooks/useGame';

interface ResultsScreenProps {
  game: Game;
  players: Player[];
  sessionScores: SessionScore[];
  currentPlayer: Player;
  isHost: boolean;
  onPlayAgain: () => void;
}

export default function ResultsScreen({ game, players, sessionScores, currentPlayer, isHost, onPlayAgain }: ResultsScreenProps) {
  const imposters = players.filter(p => p.is_imposter);
  const imposterIds = new Set(imposters.map(p => p.id));

  // Count votes
  const voteCounts: Record<string, number> = {};
  players.forEach(p => {
    if (p.vote_for) {
      voteCounts[p.vote_for] = (voteCounts[p.vote_for] || 0) + 1;
    }
  });

  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  const mostVotedId = Object.entries(voteCounts).find(([_, v]) => v === maxVotes)?.[0];

  // Determine outcome
  const noImposters = imposters.length === 0;
  const imposterCaught = !noImposters && mostVotedId != null && imposterIds.has(mostVotedId);

  const resultTitle = noImposters
    ? 'No Imposters!'
    : imposterCaught
    ? 'Civilians Win!'
    : imposters.length > 1
    ? 'Imposters Win!'
    : 'Imposter Wins!';

  const resultSubtitle = noImposters
    ? 'There were no imposters this round.'
    : imposterCaught
    ? `${imposters.map(p => p.name).join(', ')} ${imposters.length > 1 ? 'were' : 'was'} caught!`
    : `${imposters.map(p => p.name).join(', ')} got away with it!`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-scale-in">
        {/* Result banner */}
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${
            imposterCaught || noImposters ? 'bg-game-success/15' : 'bg-game-danger/15'
          }`}>
            {imposterCaught || noImposters
              ? <Trophy className="w-10 h-10 text-game-success" />
              : <Skull className="w-10 h-10 text-game-danger" />
            }
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${imposterCaught || noImposters ? 'text-game-success' : 'text-game-danger'}`}>
              {resultTitle}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{resultSubtitle}</p>
          </div>
        </div>

        {/* Word reveal */}
        <div className="px-5 py-4 rounded-2xl bg-secondary/60 border border-border/50 text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">The word was</p>
          <p className="text-xl font-bold">{game.word}</p>
          <p className="text-xs text-muted-foreground">Imposter clue: "{game.imposter_clue}"</p>
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

        {/* Session Leaderboard */}
        {sessionScores.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Medal className="w-3.5 h-3.5" />
              Session Leaderboard
            </div>
            <div className="space-y-2">
              {sessionScores.map((score, index) => {
                const player = players.find(p => p.id === score.player_id);
                if (!player) return null;
                
                return (
                  <div
                    key={score.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-400/10 to-slate-400/10 border-gray-400/20'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-600/10 to-amber-600/10 border-orange-600/20'
                        : 'bg-secondary/40 border-border/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-slate-400 text-white'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {score.rounds_won} round{score.rounds_won !== 1 ? 's' : ''} won • {score.correct_votes} correct vote{score.correct_votes !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{score.score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
