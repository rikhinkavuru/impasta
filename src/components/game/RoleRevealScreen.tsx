import { EyeOff, Eye } from 'lucide-react';
import type { Game, Player } from '@/hooks/useGame';

interface RoleRevealScreenProps {
  game: Game;
  currentPlayer: Player;
  isHost: boolean;
  onProceed: () => void;
}

export default function RoleRevealScreen({ game, currentPlayer, isHost, onProceed }: RoleRevealScreenProps) {
  const isImposter = currentPlayer.is_imposter;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-scale-in">
        <div className="text-center space-y-6">
          {/* Role badge */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${
            isImposter ? 'bg-game-danger/15' : 'bg-game-success/15'
          }`}>
            {isImposter 
              ? <EyeOff className="w-10 h-10 text-game-danger" />
              : <Eye className="w-10 h-10 text-game-success" />
            }
          </div>

          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${
              isImposter ? 'text-game-danger' : 'text-game-success'
            }`}>
              {isImposter ? 'You are an Imposter' : 'You are a Civilian'}
            </p>
          </div>

          {/* Word / Clue */}
          <div className={`px-6 py-5 rounded-2xl border-2 ${
            isImposter 
              ? 'bg-game-danger/5 border-game-danger/20' 
              : 'bg-game-success/5 border-game-success/20'
          }`}>
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
              {isImposter ? 'Your Clue' : 'The Secret Word'}
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {isImposter ? game.imposter_clue : game.word}
            </p>
          </div>

          {isImposter && (
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
              Blend in! Give clues that sound like you know the word without revealing that you don't.
            </p>
          )}
        </div>

        {isHost && (
          <button
            onClick={onProceed}
            className="w-full px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.97] transition-transform"
          >
            Everyone Ready → Start Clues
          </button>
        )}

        {!isHost && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Waiting for host to proceed...
          </p>
        )}
      </div>
    </div>
  );
}
