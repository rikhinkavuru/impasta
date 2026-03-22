import { useState, useEffect } from 'react';
import { Copy, Check, Settings, Users, Play, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import type { Game, Player, GameSettings } from '@/hooks/useGame';
import type { Difficulty } from '@/lib/wordBank';

interface LobbyScreenProps {
  game: Game;
  players: Player[];
  isHost: boolean;
  onStartGame: (customWord?: string, customClue?: string) => void;
  onUpdateSettings: (settings: GameSettings) => void;
}

const difficultyDescriptions: Record<Difficulty, string> = {
  easy: 'Clue is very close to the word',
  medium: 'Clue is somewhat related',
  hard: 'Clue is loosely connected',
};

export default function LobbyScreen({ game, players, isHost, onStartGame, onUpdateSettings }: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customWord, setCustomWord] = useState('');
  const [customClue, setCustomClue] = useState('');
  const [useCustomWord, setUseCustomWord] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>((game.difficulty as Difficulty) || 'medium');
  const [imposterMin, setImposterMin] = useState<number>(game.imposter_min ?? 1);
  const [imposterMax, setImposterMax] = useState<number>(game.imposter_max ?? 1);

  useEffect(() => {
    setDifficulty((game.difficulty as Difficulty) || 'medium');
    setImposterMin(game.imposter_min ?? 1);
    setImposterMax(game.imposter_max ?? 1);
  }, [game.difficulty, game.imposter_min, game.imposter_max]);

  // Sync settings to DB when they change
  useEffect(() => {
    if (!isHost) return;
    const n = players.length;
    const min = Math.max(0, Math.min(imposterMin, n));
    const max = Math.max(min, Math.min(imposterMax, n));
    onUpdateSettings({ difficulty, imposterMin: min, imposterMax: max });
  }, [difficulty, imposterMin, imposterMax, isHost, onUpdateSettings, players.length]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (useCustomWord && customWord.trim() && customClue.trim()) {
      onStartGame(customWord.trim(), customClue.trim());
    } else {
      onStartGame();
    }
  };

  const playerCount = players.length;
  const minSel = Math.min(imposterMin, playerCount);
  const displayMax = Math.max(minSel, Math.min(imposterMax, playerCount));
  const minOptions = Array.from({ length: playerCount + 1 }, (_, i) => i);
  const maxOptions = Array.from({ length: playerCount - minSel + 1 }, (_, i) => minSel + i);

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

        {/* Host Settings */}
        {isHost && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <Settings className="w-3.5 h-3.5" />
              Game Settings
              {showSettings ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {showSettings && (
              <div className="space-y-4 animate-fade-in-up rounded-2xl bg-secondary/40 border border-border/50 p-4">
                {/* Difficulty */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all active:scale-[0.96] ${
                          difficulty === d
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/60 border border-border/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{difficultyDescriptions[difficulty]}</p>
                </div>

                {/* Imposter count range (random each round) */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5" />
                    Imposters (random per round)
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-muted-foreground">Min</label>
                      <select
                        value={minSel}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setImposterMin(v);
                          setImposterMax((m) => Math.max(v, m));
                        }}
                        className="px-3 py-2 rounded-xl text-sm font-semibold bg-secondary/60 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {minOptions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-muted-foreground pb-2 text-sm">–</span>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-muted-foreground">Max</label>
                      <select
                        value={displayMax}
                        onChange={(e) => setImposterMax(Number(e.target.value))}
                        className="px-3 py-2 rounded-xl text-sm font-semibold bg-secondary/60 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {maxOptions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {(() => {
                      const lo = minSel;
                      const hi = displayMax;
                      if (lo === hi) {
                        return lo === 0
                          ? 'Exactly 0 imposters each round'
                          : `Exactly ${lo} imposter${lo > 1 ? 's' : ''} each round`;
                      }
                      return `Each round the game picks ${lo}–${hi} imposters at random (based on ${playerCount} players)`;
                    })()}
                  </p>
                </div>

                {/* Custom Word */}
                <div className="space-y-2">
                  <button
                    onClick={() => setUseCustomWord(!useCustomWord)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {useCustomWord ? '✕ Use random word instead' : '+ Use custom word'}
                  </button>
                  {useCustomWord && (
                    <div className="space-y-2 animate-fade-in-up">
                      <input
                        type="text"
                        value={customWord}
                        onChange={(e) => setCustomWord(e.target.value)}
                        placeholder="Secret word"
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      />
                      <input
                        type="text"
                        value={customClue}
                        onChange={(e) => setCustomClue(e.target.value)}
                        placeholder="Imposter's clue"
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      />
                    </div>
                  )}
                </div>
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
