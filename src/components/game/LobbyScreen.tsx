import { useState, useEffect, useRef } from 'react';
import { Copy, Check, Settings, ChevronDown, ChevronUp, Shuffle, Hash, MessageSquare, Zap, Flame, Brain } from 'lucide-react';
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

const difficultyConfig: Record<Difficulty, { icon: typeof Zap; label: string; desc: string }> = {
  easy: { icon: Zap, label: 'Easy', desc: 'Close clue' },
  medium: { icon: Flame, label: 'Medium', desc: 'Related clue' },
  hard: { icon: Brain, label: 'Hard', desc: 'Loose clue' },
};

function inferImposterRandom(g: Game): boolean {
  if (typeof g.imposter_random === 'boolean') return g.imposter_random;
  return g.imposter_min !== g.imposter_max;
}

/* ── Segmented Control ── */
function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  renderOption,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  renderOption: (opt: T, active: boolean) => React.ReactNode;
}) {
  return (
    <div className="flex rounded-2xl bg-secondary/50 p-1 gap-0.5">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-[0.85rem] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {renderOption(opt, active)}
          </button>
        );
      })}
    </div>
  );
}

/* ── Settings Row ── */
function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.25em] pl-1">{label}</p>
      {children}
    </div>
  );
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

  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isHost && isEditingRef.current) return;
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

  const settingsPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSettingsRef = useRef({ difficulty, imposterRandom, imposterMin, imposterMax, fixedCount, clueRounds });

  useEffect(() => {
    if (!isHost) return;
    const prev = prevSettingsRef.current;
    const changed =
      prev.difficulty !== difficulty ||
      prev.imposterRandom !== imposterRandom ||
      prev.imposterMin !== imposterMin ||
      prev.imposterMax !== imposterMax ||
      prev.fixedCount !== fixedCount ||
      prev.clueRounds !== clueRounds;
    if (!changed) return;
    prevSettingsRef.current = { difficulty, imposterRandom, imposterMin, imposterMax, fixedCount, clueRounds };

    if (settingsPushTimerRef.current) clearTimeout(settingsPushTimerRef.current);
    settingsPushTimerRef.current = setTimeout(() => {
      const n = players.length;
      if (imposterRandom) {
        const min = Math.max(0, Math.min(imposterMin, n));
        const max = Math.max(min, Math.min(imposterMax, n));
        onUpdateSettings({ difficulty, imposterRandom: true, imposterMin: min, imposterMax: max, clueRounds });
      } else {
        const c = Math.min(Math.max(0, fixedCount), n);
        onUpdateSettings({ difficulty, imposterRandom: false, imposterMin: c, imposterMax: c, clueRounds });
      }
    }, 300);
    return () => {
      if (settingsPushTimerRef.current) clearTimeout(settingsPushTimerRef.current);
    };
  }, [difficulty, imposterRandom, imposterMin, imposterMax, fixedCount, clueRounds, isHost, onUpdateSettings, players.length]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playerCount = players.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-background overflow-hidden">

      {/* Top: Game Code */}
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

      {/* Middle: Players */}
      <div className="flex-1 w-full max-w-2xl flex flex-wrap items-center justify-center gap-4 p-8">
        {players.map((player, i) => (
          <div
            key={player.id}
            className="animate-fade-in-up flex items-center gap-3 px-6 py-3 rounded-full bg-white premium-shadow border border-border/50 animate-float"
            style={{
              animationDelay: `${i * 150}ms`,
              animationDuration: `${3 + (i % 2)}s`,
            }}
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-extrabold text-primary">
              {player.name[0].toUpperCase()}
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">{player.name}</span>
            {player.is_host && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </div>
        ))}
        {players.length < 3 && (
          <p className="w-full text-center text-[10px] font-extrabold text-muted-foreground/40 uppercase tracking-[0.2em] mt-8 animate-pulse">
            Waiting for more players...
          </p>
        )}
      </div>

      {/* Bottom: Controls */}
      <div className="w-full max-w-md pb-12 space-y-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>

        {isHost && (
          <div className="space-y-4">
            {/* Settings Toggle */}
            <button
              onClick={() => {
                isEditingRef.current = !showSettings;
                setShowSettings(s => !s);
              }}
              className="flex items-center justify-center gap-2 text-[10px] font-extrabold text-muted-foreground/60 hover:text-foreground transition-colors w-full uppercase tracking-[0.2em]"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Settings Panel */}
            {showSettings && (
              <div className="space-y-5 p-5 rounded-[1.5rem] bg-white/80 backdrop-blur-sm premium-shadow border border-border/30 animate-scale-in">

                {/* Difficulty */}
                <SettingsRow label="Difficulty">
                  <SegmentedControl
                    options={['easy', 'medium', 'hard'] as Difficulty[]}
                    value={difficulty}
                    onChange={setDifficulty}
                    renderOption={(d, active) => {
                      const cfg = difficultyConfig[d];
                      const Icon = cfg.icon;
                      return (
                        <>
                          <Icon className="w-3 h-3" />
                          <span>{cfg.label}</span>
                        </>
                      );
                    }}
                  />
                  <p className="text-[9px] text-muted-foreground/50 pl-1 italic">{difficultyConfig[difficulty].desc}</p>
                </SettingsRow>

                {/* Divider */}
                <div className="h-px bg-border/40" />

                {/* Clue Rounds */}
                <SettingsRow label="Clue Rounds">
                  <SegmentedControl
                    options={[1, 2, 3]}
                    value={clueRounds}
                    onChange={setClueRounds}
                    renderOption={(r) => (
                      <>
                        <MessageSquare className="w-3 h-3" />
                        <span>{r}</span>
                      </>
                    )}
                  />
                </SettingsRow>

                {/* Divider */}
                <div className="h-px bg-border/40" />

                {/* Imposters */}
                <SettingsRow label="Imposters">
                  <SegmentedControl
                    options={['fixed', 'random'] as const}
                    value={imposterRandom ? 'random' : 'fixed'}
                    onChange={(v) => setImposterRandom(v === 'random')}
                    renderOption={(opt) => (
                      <>
                        {opt === 'fixed' ? <Hash className="w-3 h-3" /> : <Shuffle className="w-3 h-3" />}
                        <span>{opt === 'fixed' ? 'Fixed' : 'Random'}</span>
                      </>
                    )}
                  />

                  {/* Fixed count chips */}
                  {!imposterRandom && (
                    <div className="flex gap-1.5 pt-1">
                      {Array.from({ length: Math.min(Math.max(playerCount + 1, 2), 7) }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFixedCount(i)}
                          className={cn(
                            'w-9 h-9 rounded-xl text-xs font-extrabold transition-all duration-200',
                            fixedCount === i
                              ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                          )}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Random range */}
                  {imposterRandom && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
                        <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">Min</span>
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
                          className="w-full bg-transparent border-0 text-center text-sm font-bold text-foreground focus:outline-none focus:ring-0"
                        />
                      </div>
                      <span className="text-muted-foreground/40 text-xs font-bold">—</span>
                      <div className="flex-1 flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
                        <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">Max</span>
                        <input
                          type="number"
                          min={imposterMin}
                          max={playerCount}
                          value={imposterMax}
                          onChange={(e) => {
                            const val = Math.max(imposterMin, Math.min(Number(e.target.value), playerCount));
                            setImposterMax(val);
                          }}
                          className="w-full bg-transparent border-0 text-center text-sm font-bold text-foreground focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  )}
                </SettingsRow>
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
