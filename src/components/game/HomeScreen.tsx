import { useState } from 'react';
import { Eye, EyeOff, Users, Zap } from 'lucide-react';

interface HomeScreenProps {
  onCreateGame: (name: string) => void;
  onJoinGame: (code: string, name: string) => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export default function HomeScreen({ onCreateGame, onJoinGame, loading, error, clearError }: HomeScreenProps) {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        {/* Logo area */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Eye className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance leading-[1.1]">
            Imposter
          </h1>
          <p className="text-muted-foreground text-sm">
            Find the imposter. Don't get caught.
          </p>
        </div>

        {error && (
          <div className="bg-game-danger/10 border border-game-danger/20 rounded-lg px-4 py-3 text-sm text-game-danger animate-scale-in">
            {error}
            <button onClick={clearError} className="ml-2 underline text-xs opacity-70">dismiss</button>
          </div>
        )}

        {mode === 'menu' && (
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base card-hover active:scale-[0.97] transition-transform"
            >
              <Zap className="w-5 h-5" />
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-base card-hover active:scale-[0.97] transition-transform"
            >
              <Users className="w-5 h-5" />
              Join Game
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="w-full px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform"
            >
              {loading ? 'Creating...' : 'Create Lobby'}
            </button>
            <button onClick={() => setMode('menu')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Game Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base font-mono tracking-[0.3em] text-center text-xl"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={loading || !name.trim() || !code.trim()}
              className="w-full px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform"
            >
              {loading ? 'Joining...' : 'Join Lobby'}
            </button>
            <button onClick={() => setMode('menu')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
