import { useState, useEffect } from 'react';
import { Copy, Check, Settings, Users, Play, ChevronDown, ChevronUp, Shuffle, Hash } from 'lucide-react';
import type { Game, Player, GameSettings } from '@/hooks/useGame';
import type { Difficulty } from '@/lib/wordBank';
import { cn } from '@/lib/utils';

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

function inferImposterRandom(g: Game): boolean {
  if (typeof g.imposter_random === 'boolean') return g.imposter_random;
  return g.imposter_min !== g.imposter_max;
}

export default function LobbyScreen({ game, players, isHost, onStartGame, onUpdateSettings }: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customWord, setCustomWord] = useState('');
  const [customClue, setCustomClue] = useState('');
  const [useCustomWord, setUseCustomWord] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>((game.difficulty as Difficulty) || 'medium');
  const [imposterRandom, setImposterRandom] = useState(() => inferImposterRandom(game));
  const [fixedCount, setFixedCount] = useState(() =>
    inferImposterRandom(game) ? 1 : Math.min(game.imposter_min ?? 1, players.length || 1),
  );
  const [imposterMin, setImposterMin] = useState<number>(game.imposter_min ?? 1);
  const [imposterMax, setImposterMax] = useState<number>(game.imposter_max ?? 1);

  useEffect(() => {
    setDifficulty((game.difficulty as Difficulty) || 'medium');
    const random =
      typeof game.imposter_random === 'boolean'
        ? game.imposter_random
        : game.imposter_min !== game.imposter_max;
    setImposterRandom(random);
    if (random) {
      setImposterMin(game.imposter_min ?? 1);
      setImposterMax(game.imposter_max ?? 1);
    } else {
      setFixedCount(Math.min(game.imposter_min ?? 1, players.length));
    }
  }, [game.difficulty, game.imposter_min, game.imposter_max, game.imposter_random, players.length]);

  useEffect(() => {
    if (!isHost) return;
    const n = players.length;
    if (imposterRandom) {
      const min = Math.max(0, Math.min(imposterMin, n));
      const max = Math.max(min, Math.min(imposterMax, n));
      onUpdateSettings({ difficulty, imposterRandom: true, imposterMin: min, imposterMax: max });
    } else {
      const c = Math.min(Math.max(0, fixedCount), n);
      onUpdateSettings({ difficulty, imposterRandom: false, imposterMin: c, imposterMax: c });
    }
  }, [
    difficulty,
    imposterRandom,
    imposterMin,
    imposterMax,
    fixedCount,
    isHost,
    onUpdateSettings,
    players.length,
  ]);

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

                {/* Imposters: fixed count vs random range */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Imposters</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (imposterRandom) {
                          setFixedCount(Math.min(minSel, playerCount));
                        }
                        setImposterRandom(false);
                      }}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                        !imposterRandom
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'border border-border/50 bg-secondary/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Hash className="h-4 w-4 shrink-0" />
                      Fixed
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!imposterRandom) {
                          setImposterMin(1);
                          setImposterMax(Math.max(1, Math.min(4, playerCount)));
                        }
                        setImposterRandom(true);
                      }}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                        imposterRandom
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'border border-border/50 bg-secondary/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Shuffle className="h-4 w-4 shrink-0" />
                      Random
                    </button>
                  </div>

                  {!imposterRandom ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Same count every round (0 = none)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: playerCount + 1 }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFixedCount(i)}
                            className={cn(
                              'min-w-[2.25rem] rounded-lg px-2.5 py-2 text-sm font-semibold transition-all active:scale-[0.96]',
                              fixedCount === i
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'border border-border/50 bg-secondary/60 text-muted-foreground hover:text-foreground',
                            )}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-border/60 bg-background/30 p-4">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Each new round picks a random number of imposters in this range (capped by how many people are playing).
                      </p>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground block mb-1.5">Minimum</label>
                            <input
                              type="number"
                              min="0"
                              max={playerCount}
                              value={imposterMin}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(Number(e.target.value), playerCount));
                                setImposterMin(val);
                                if (val > imposterMax) setImposterMax(val);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-medium"
                            />
                          </div>
                          <span className="hidden text-sm text-muted-foreground sm:block">to</span>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground block mb-1.5">Maximum</label>
                            <input
                              type="number"
                              min="0"
                              max={playerCount}
                              value={imposterMax}
                              onChange={(e) => {
                                const val = Math.max(imposterMin, Math.min(Number(e.target.value), playerCount));
                                setImposterMax(val);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-medium"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {minSel === displayMax
                          ? `Will use ${minSel} imposter${minSel === 1 ? '' : 's'} each round (set min & max different for variety)`
                          : `Each round: between ${minSel} and ${displayMax} imposters`}
                      </p>
                    </div>
                  )}
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
