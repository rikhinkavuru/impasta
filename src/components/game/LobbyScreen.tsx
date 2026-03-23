import { useState, useEffect } from 'react';
import { Copy, Check, Settings, ChevronDown, ChevronUp, Shuffle, Hash, MessageSquare } from 'lucide-react';
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
  const [difficulty, setDifficulty] = useState<Difficulty>((game.difficulty as Difficulty) || 'medium');
  const [imposterRandom, setImposterRandom] = useState(() => inferImposterRandom(game));
  const [fixedCount, setFixedCount] = useState(() =>
    inferImposterRandom(game) ? 1 : Math.min(game.imposter_min ?? 1, players.length || 1),
  );
  const [imposterMin, setImposterMin] = useState<number>(game.imposter_min ?? 1);
  const [imposterMax, setImposterMax] = useState<number>(game.imposter_max ?? 1);
  const [clueRounds, setClueRounds] = useState<number>(game.clue_rounds ?? 1);

  // Synchronize local state with remote game data, but only if not host to avoid feedback loops
  // or if it's the first load.
  useEffect(() => {
    if (isHost && showSettings) return; // Don't overwrite host's active editing

    setDifficulty((game.difficulty as Difficulty) || 'medium');
    const random =
      typeof game.imposter_random === 'boolean'
        ? game.imposter_random
        : game.imposter_min !== game.imposter_max;
    
    setImposterRandom(random);
    setImposterMin(game.imposter_min ?? 1);
    setImposterMax(game.imposter_max ?? 1);
    setFixedCount(game.imposter_min ?? 1);
    setClueRounds(game.clue_rounds ?? 1);
  }, [game.difficulty, game.imposter_min, game.imposter_max, game.imposter_random, game.clue_rounds, isHost]);

  useEffect(() => {
    if (!isHost) return;
    const n = players.length;
    if (imposterRandom) {
      const min = Math.max(0, Math.min(imposterMin, n));
      const max = Math.max(min, Math.min(imposterMax, n));
      onUpdateSettings({ difficulty, imposterRandom: true, imposterMin: min, imposterMax: max, clueRounds });
    } else {
      const c = Math.min(Math.max(0, fixedCount), n);
      onUpdateSettings({ difficulty, imposterRandom: false, imposterMin: c, imposterMax: c, clueRounds });
    }
  }, [
    difficulty,
    imposterRandom,
    imposterMin,
    imposterMax,
    fixedCount,
    clueRounds,
    isHost,
    onUpdateSettings,
    players.length,
  ]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playerCount = players.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-background overflow-hidden">
      
      {/* Top Section: Game Code */}
      <div className="w-full max-w-md pt-12 space-y-6 animate-fade-in-up">
        <div className="text-center space-y-4">
          <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Game Code</p>
          <button
            onClick={copyCode}
            className="group relative inline-flex items-center gap-4 px-10 py-5 rounded-3xl bg-white premium-shadow border border-border/50 transition-all duration-300 active:scale-95"
          >
            <span className="text-4xl font-extrabold font-mono tracking-[0.2em] text-foreground">{game.code}</span>
            <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </div>
          </button>
        </div>
      </div>

      {/* Middle Section: Players */}
      <div className="flex-1 w-full max-w-2xl flex flex-wrap items-center justify-center gap-4 p-8">
        {players.map((player, i) => (
          <div
            key={player.id}
            className="animate-fade-in-up flex items-center gap-3 px-6 py-3 rounded-full bg-white premium-shadow border border-border/50 animate-float"
            style={{ 
              animationDelay: `${i * 150}ms`,
              animationDuration: `${3 + (i % 2)}s`
            }}
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-extrabold text-primary">
              {player.name[0].toUpperCase()}
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">{player.name}</span>
            {player.is_host && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </div>
        ))}
        {players.length < 3 && (
          <p className="w-full text-center text-[10px] font-extrabold text-muted-foreground/40 uppercase tracking-[0.2em] mt-8 animate-pulse">
            Waiting for more players...
          </p>
        )}
      </div>

      {/* Bottom Section: Controls */}
      <div className="w-full max-w-md pb-12 space-y-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        
        {isHost && (
          <div className="space-y-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-center gap-2 text-[10px] font-extrabold text-muted-foreground/60 hover:text-foreground transition-colors w-full uppercase tracking-[0.2em]"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSettings && (
              <div className="space-y-6 p-6 rounded-[2rem] bg-white premium-shadow border border-border/50 animate-scale-in">
                {/* Difficulty */}
                <div className="space-y-4">
                  <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.2em]">Difficulty</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-4 py-3 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                          difficulty === d
                            ? 'bg-primary text-primary-foreground accent-glow'
                            : 'bg-secondary/40 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clue Rounds */}
                <div className="space-y-4">
                  <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.2em]">Clue Rounds</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setClueRounds(r)}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all',
                          clueRounds === r ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground'
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Imposters Selection Mode */}
                <div className="space-y-4">
                  <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.2em]">Imposter Selection</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImposterRandom(false)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all',
                        !imposterRandom ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground'
                      )}
                    >
                      <Hash className="h-3.5 w-3.5" />
                      Fixed
                    </button>
                    <button
                      type="button"
                      onClick={() => setImposterRandom(true)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all',
                        imposterRandom ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground'
                      )}
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      Random
                    </button>
                  </div>
                </div>

                {/* Fixed Count or Random Range */}
                {!imposterRandom ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.2em]">Count</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: Math.min(Math.max(playerCount + 1, 2), 7) }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFixedCount(i)}
                          className={cn(
                            'w-10 h-10 rounded-xl text-[10px] font-extrabold uppercase transition-all',
                            fixedCount === i ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground'
                          )}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.2em]">Range</p>
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-[0.1em]">{imposterMin} to {imposterMax}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Min</label>
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
                          className="w-full luxury-input text-base py-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Max</label>
                        <input
                          type="number"
                          min={imposterMin}
                          max={playerCount}
                          value={imposterMax}
                          onChange={(e) => {
                            const val = Math.max(imposterMin, Math.min(Number(e.target.value), playerCount));
                            setImposterMax(val);
                          }}
                          className="w-full luxury-input text-base py-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onStartGame()}
              disabled={players.length < 3}
              className="w-full pill-button bg-primary text-primary-foreground accent-glow disabled:opacity-30 disabled:grayscale"
            >
              START GAME
            </button>
          </div>
        )}

        {!isHost && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Waiting for host</p>
          </div>
        )}
      </div>
    </div>
  );
}
