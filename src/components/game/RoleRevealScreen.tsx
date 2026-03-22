import { useState } from 'react';
import { EyeOff, Eye, ChevronRight } from 'lucide-react';
import type { Game, Player } from '@/hooks/useGame';

interface RoleRevealScreenProps {
  game: Game;
  currentPlayer: Player;
  isHost: boolean;
  onProceed: () => void;
}

export default function RoleRevealScreen({ game, currentPlayer, isHost, onProceed }: RoleRevealScreenProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isImposter = currentPlayer.is_imposter;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-1000 ${
      isFlipped && isImposter ? 'bg-destructive/5' : 'bg-background'
    }`}>
      <div className="w-full max-w-sm space-y-12 animate-fade-in-up">
        
        <div className="text-center space-y-4">
          <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">
            Secret Role
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {isFlipped ? (isImposter ? 'YOU ARE THE IMPOSTER' : 'YOU ARE A CIVILIAN') : 'REVEAL YOUR IDENTITY'}
          </h2>
        </div>

        {/* 3D Flip Card */}
        <div 
          className="perspective-1000 w-full h-96 cursor-pointer group"
          onClick={() => setIsFlipped(true)}
        >
          <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front Side */}
            <div className="absolute inset-0 w-full h-full backface-hidden rounded-[3rem] bg-white premium-shadow border border-border/50 flex flex-col items-center justify-center p-8 text-center space-y-8">
              <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center animate-float">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-bold text-muted-foreground/60 tracking-tight">
                TAP TO FLIP
              </p>
            </div>

            {/* Back Side */}
            <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[3rem] bg-white premium-shadow border-2 flex flex-col items-center justify-center p-8 text-center space-y-8 ${
              isImposter ? 'border-destructive/20' : 'border-primary/20'
            }`}>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                isImposter ? 'bg-destructive/10' : 'bg-primary/10'
              }`}>
                {isImposter 
                  ? <EyeOff className="w-10 h-10 text-destructive" />
                  : <Eye className="w-10 h-10 text-primary" />
                }
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">
                  {isImposter ? 'Your Clue' : 'The Secret Word'}
                </p>
                <p className={`text-5xl font-extrabold tracking-tighter ${
                  isImposter ? 'text-destructive' : 'text-primary'
                }`}>
                  {isImposter ? game.imposter_clue : game.word}
                </p>
              </div>

              {isImposter && (
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[200px]">
                  Blend in. Give clues that sound like you know the word.
                </p>
              )}
            </div>

          </div>
        </div>

        {isFlipped && (
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {isHost ? (
              <button
                onClick={onProceed}
                className="w-full pill-button bg-primary text-primary-foreground accent-glow flex items-center justify-center gap-2"
              >
                EVERYONE READY
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Waiting for host</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
