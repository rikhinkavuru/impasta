import { Trophy, Medal, Award } from 'lucide-react';
import type { Player } from '@/hooks/useGame';

interface LeaderboardProps {
  players: Player[];
  title?: string;
  showScores?: boolean;
}

export default function Leaderboard({ players, title = "Leaderboard", showScores = true }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20';
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/20';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/20';
      default:
        return 'bg-secondary/40 border-border/30';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Trophy className="w-3.5 h-3.5" />
        {title}
      </div>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const rank = index + 1;
          const scoreChange = 0; // We could track score changes per round if needed
          
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02] ${getRankColor(rank)}`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(rank)}
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {player.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{player.name}</p>
                {player.is_host && (
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Host</span>
                )}
              </div>
              {showScores && (
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{player.score}</p>
                  {scoreChange !== 0 && (
                    <p className={`text-[10px] font-medium ${scoreChange > 0 ? 'text-game-success' : 'text-game-danger'}`}>
                      {scoreChange > 0 ? '+' : ''}{scoreChange}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {players.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No players yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
