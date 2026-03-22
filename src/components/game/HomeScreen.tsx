import { useState, useEffect } from 'react';
import { preloadWordBank } from '@/lib/wordBank';

interface HomeScreenProps {
  onCreateGame: (name: string) => void;
  onJoinGame: (code: string, name: string) => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export default function HomeScreen({ onCreateGame, onJoinGame, loading, error, clearError }: HomeScreenProps) {
  useEffect(() => {
    preloadWordBank();
  }, []);

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateGame(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !code.trim()) return;
    onJoinGame(code.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md mx-auto space-y-16">
        
        {/* Logo area */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <h1 className="text-fluid-h1 font-extrabold tracking-tighter text-foreground leading-none">
            Imposter
          </h1>
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground/60">
            Premium Party Experience
          </p>
        </div>

        {error && (
          <div className="bg-destructive/5 border border-destructive/10 rounded-2xl px-6 py-4 text-sm text-destructive animate-scale-in text-center">
            {error}
            <button onClick={clearError} className="ml-3 font-bold underline opacity-70">dismiss</button>
          </div>
        )}

        {mode === 'menu' && (
          <div className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <button
              onClick={() => setMode('create')}
              className="pill-button bg-primary text-primary-foreground accent-glow"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="pill-button bg-secondary text-secondary-foreground border border-border"
            >
              Join Game
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-12 animate-fade-in-up">
            <div className="space-y-4">
              <label className="block text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Identity</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="YOUR NAME"
                maxLength={20}
                autoFocus
                className="w-full luxury-input"
              />
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="pill-button bg-primary text-primary-foreground accent-glow"
              >
                {loading ? 'PREPARING...' : 'CREATE LOBBY'}
              </button>
              <button onClick={() => setMode('menu')} className="text-[10px] font-extrabold tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors uppercase">
                ← Back
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-10 animate-fade-in-up">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Identity</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="YOUR NAME"
                  maxLength={20}
                  autoFocus
                  className="w-full luxury-input"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Game Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={6}
                  className="w-full luxury-input font-mono tracking-[0.5em]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleJoin}
                disabled={loading || !name.trim() || !code.trim()}
                className="pill-button bg-primary text-primary-foreground accent-glow"
              >
                {loading ? 'CONNECTING...' : 'JOIN LOBBY'}
              </button>
              <button onClick={() => setMode('menu')} className="text-[10px] font-extrabold tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors uppercase">
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
