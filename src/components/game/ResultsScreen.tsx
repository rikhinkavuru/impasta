import { Trophy, Skull, RotateCcw, Medal, ArrowRight } from 'lucide-react';
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
      let votedIds: string[];
      try {
        const parsed = JSON.parse(p.vote_for);
        votedIds = Array.isArray(parsed) ? parsed : [p.vote_for];
      } catch {
        votedIds = [p.vote_for];
      }
      votedIds.forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });
    }
  });

  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  const mostVotedIds = Object.entries(voteCounts)
    .filter(([, v]) => v === maxVotes && v > 0)
    .map(([id]) => id);

  // Civilians win only if exactly one person received the most votes AND they are an imposter.
  // All other outcomes (tie, wrong person, no votes) are an imposter win.
  const imposterCaught = mostVotedIds.length === 1 && imposterIds.has(mostVotedIds[0]);
  const civiliansWon = imposterCaught;

  const resultTitle = civiliansWon ? 'CIVILIANS WIN!' : 'IMPOSTERS WIN!';
  const resultSubtitle = civiliansWon
    ? `${imposters.map(p => p.name).join(', ')} ${imposters.length > 1 ? 'were' : 'was'} caught!`
    : mostVotedIds.length > 1
    ? 'A tie in voting allowed the imposters to escape!'
    : maxVotes === 0
    ? 'Nobody voted, and the imposters got away!'
    : 'The wrong person was eliminated!';

  // Sort scores for leaderboard
  const sortedScores = [...sessionScores].sort((a, b) => b.score - a.score);

  // Count skip votes (voted but chose nobody)
  const skipVotes = players.filter(p => p.has_voted && p.vote_for === null).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-background pt-16">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">

        {/* Cinematic Reveal Section */}
        <div className="text-center space-y-8 animate-scale-in">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full premium-shadow ${
            civiliansWon ? 'bg-primary/10' : 'bg-destructive/10'
          }`}>
            {civiliansWon
              ? <Trophy className="w-16 h-16 text-primary animate-bounce" />
              : <Skull className="w-16 h-16 text-destructive animate-float" />
            }
          </div>

          <div className="space-y-4">
            <h2 className={`text-5xl font-extrabold tracking-tighter ${
              civiliansWon ? 'text-primary' : 'text-destructive'
            }`}>
              {resultTitle}
            </h2>
            <p className="text-sm font-medium text-muted-foreground/80 tracking-tight">{resultSubtitle}</p>
          </div>
        </div>

        {/* Word reveal */}
        <div
          className="p-8 rounded-[3rem] bg-white premium-shadow border border-border/50 text-center space-y-4 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">The Secret Word</p>
            <p className="text-4xl font-extrabold tracking-tighter text-foreground uppercase">{game.word}</p>
          </div>
          <div className="w-full h-px bg-border/50" />
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Imposter Clue</p>
            <p className="text-lg font-extrabold tracking-tight text-muted-foreground uppercase italic">{game.imposter_clue}</p>
          </div>
        </div>

        {/* Vote breakdown */}
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em] text-center">Vote Results</p>
          <div className="grid grid-cols-1 gap-3">
            {players.map((player) => {
              const votes = voteCounts[player.id] || 0;
              const isMostVoted = mostVotedIds.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] border transition-all duration-300 ${
                    player.is_imposter
                      ? 'bg-destructive/5 border-destructive/20'
                      : 'bg-white premium-shadow border-border/50'
                  } ${isMostVoted ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                    player.is_imposter ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'
                  }`}>
                    {player.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold tracking-tight uppercase">
                      {player.name}
                      {player.is_imposter && (
                        <span className="ml-2 text-[10px] font-black text-destructive tracking-widest">IMPOSTER</span>
                      )}
                    </p>
                    {player.clue && (
                      <p className="text-xs font-extrabold text-muted-foreground/60 uppercase italic">&ldquo;{player.clue}&rdquo;</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tabular-nums ${isMostVoted ? 'text-primary' : 'text-muted-foreground'}`}>
                      {votes}
                    </p>
                    <p className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest">VOTES</p>
                  </div>
                </div>
              );
            })}

            {/* Skip votes row */}
            {skipVotes > 0 && (
              <div className="flex items-center gap-4 px-6 py-4 rounded-[2rem] border bg-white/50 premium-shadow border-border/50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-extrabold bg-muted/20 text-muted-foreground">
                  ∅
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold tracking-tight uppercase text-muted-foreground">Nobody</p>
                  <p className="text-xs font-extrabold text-muted-foreground/60 uppercase italic">Skip votes</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tabular-nums text-muted-foreground">{skipVotes}</p>
                  <p className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest">VOTES</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Session Leaderboard */}
        {sortedScores.length > 0 && (
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-center gap-3 text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">
              <Medal className="w-3.5 h-3.5" />
              Leaderboard
            </div>
            <div className="grid grid-cols-1 gap-3">
              {sortedScores.map((score, index) => {
                const player = players.find(p => p.id === score.player_id);
                if (!player) return null;

                const isCurrentPlayer = score.player_id === currentPlayer.id;

                return (
                  <div
                    key={score.id}
                    className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] border ${
                      index === 0
                        ? 'bg-primary text-primary-foreground accent-glow border-primary'
                        : isCurrentPlayer
                        ? 'bg-primary/5 border-primary/30 premium-shadow'
                        : 'bg-white premium-shadow border-border/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-white text-primary' : 'bg-primary/10 text-primary'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold tracking-tight uppercase">
                        {player.name}
                        {isCurrentPlayer && (
                          <span className="ml-2 text-[10px] opacity-60">YOU</span>
                        )}
                      </p>
                      <p className={`text-[10px] font-bold tracking-tight uppercase ${index === 0 ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {score.rounds_won} WON &bull; {score.correct_votes} CORRECT
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${index === 0 ? 'text-primary-foreground' : 'text-primary'}`}>{score.score}</p>
                      <p className={`text-[8px] font-extrabold uppercase tracking-widest ${index === 0 ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>PTS</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="py-12 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="w-full pill-button bg-primary text-primary-foreground accent-glow flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-5 h-5" />
              PLAY AGAIN
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
              <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">
                Waiting for host to play again
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
