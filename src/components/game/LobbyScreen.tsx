import { useState } from 'react';
import { Copy, Check, Settings, Users, Play } from 'lucide-react';
import type { Game, Player } from '@/hooks/useGame';

interface LobbyScreenProps {
  game: Game;
  players: Player[];
  isHost: boolean;
  onStartGame: (customWord?: string, customClue?: string) => void;
}

export default function LobbyScreen({ game, players, isHost, onStartGame }: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customWord, setCustomWord] = useState('');
  const [customClue, setCustomClue] = useState('');

  const copyCode = async () => {
    await navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (showCustom && customWord.trim() && customClue.trim()) {
      onStartGame(customWord.trim(), customClue.trim());
    } else {
      onStartGame();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
        <div className="text-center space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Game Code</p>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary border border-border active:scale-[0.97] transition-transform"
          >
            <span className="text-3xl font-bold font-mono tracking-[0.25em]">{game.code}</span>
            {copied ? <Check className="w-5 h-5 text-game-success" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
          </button>
          <p className="text-xs text-muted-foreground">Share this code with friends</p>
        </div>

        {/* Player list */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            Players ({players.length})
          </div>
          <div className="space-y-1.5">
            {players.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 border border-border/50 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {player.name[0].toUpperCase()}
                </div>
                <span className="font-medium text-sm flex-1">{player.name}</span>
                {player.is_host && (
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom word (host only) */}
        {isHost && (
          <div className="space-y-3">
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {showCustom ? 'Use random word' : 'Use custom word'}
            </button>
            {showCustom && (
              <div className="space-y-2 animate-fade-in-up">
                <input
                  type="text"
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  placeholder="Secret word"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                <input
                  type="text"
                  value={customClue}
                  onChange={(e) => setCustomClue(e.target.value)}
                  placeholder="Imposter's clue"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Start button (host only) */}
        {isHost && (
          <button
            onClick={handleStart}
            disabled={players.length < 3}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 active:scale-[0.97] transition-transform"
          >
            <Play className="w-5 h-5" />
            Start Game {players.length < 3 && `(need ${3 - players.length} more)`}
          </button>
        )}

        {!isHost && (
          <div className="text-center text-sm text-muted-foreground animate-pulse">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
