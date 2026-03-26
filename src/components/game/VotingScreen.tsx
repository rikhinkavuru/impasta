import { useState } from 'react';
import { Vote, Check, ShieldCheck, X } from 'lucide-react';
import type { Player } from '@/hooks/useGame';
import { parseVoteIds, parseClues } from '@/lib/gameUtils';

interface VotingScreenProps {
  players: Player[];
  currentPlayer: Player;
  onVote: (playerIds: string[]) => void;
}

export default function VotingScreen({ players, currentPlayer, onVote }: VotingScreenProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [skipVote, setSkipVote] = useState(false);
  const hasVoted = !!currentPlayer.has_voted;

  const handleToggle = (id: string) => {
    setSkipVote(false);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleVote = () => {
    if (skipVote) {
      onVote([]);
    } else if (selectedIds.size > 0) {
      onVote(Array.from(selectedIds));
    }
  };

  const currentVotes = parseVoteIds(currentPlayer.vote_for);

  const votedCount = players.filter(p => p.has_voted).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-background pt-16">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">

        <div className="text-center space-y-4">
          <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">Voting Phase</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
            {hasVoted ? 'VOTES CAST' : 'IDENTIFY THE IMPOSTERS'}
          </h2>
          <p className="text-xs font-medium text-muted-foreground/60">
            {hasVoted ? 'Waiting for others to vote.' : 'Select one or more suspects. Choose wisely.'}
          </p>
        </div>

        {/* Voting Cards */}
        <div className="grid grid-cols-1 gap-4">
          {players.map((player) => {
            const isSelf = player.id === currentPlayer.id;
            const isSelected = selectedIds.has(player.id) && !skipVote;
            const isVotedFor = hasVoted && currentVotes.includes(player.id);

            return (
              <button
                key={player.id}
                disabled={hasVoted || isSelf}
                onClick={() => handleToggle(player.id)}
                className={`group relative flex flex-col items-start gap-4 p-6 rounded-[2.5rem] border-2 transition-all duration-300 text-left ${
                  isVotedFor || isSelected
                    ? 'bg-primary border-primary accent-glow'
                    : isSelf
                    ? 'bg-white/40 border-border/20 opacity-50 cursor-not-allowed'
                    : 'bg-white premium-shadow border-border/50 hover:border-primary/30 active:scale-[0.98]'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isSelected || isVotedFor ? 'bg-white text-primary' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {player.name[0].toUpperCase()}
                  </div>
                  {(isSelected || isVotedFor) && (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  {isSelf && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p
                    className={`text-lg font-extrabold tracking-tight uppercase ${
                      isSelected || isVotedFor ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {player.name}
                    {isSelf && <span className="ml-2 text-[10px] opacity-60">YOU</span>}
                  </p>
                {parseClues(player.clue).length > 0 && (
                    <div className="space-y-0.5">
                      {parseClues(player.clue).map((c, idx) => (
                        <p
                          key={idx}
                          className={`text-sm font-extrabold tracking-tight uppercase italic ${
                            isSelected || isVotedFor ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}
                        >
                          &ldquo;{c}&rdquo;
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip Vote Option */}
        {!hasVoted && (
          <button
            onClick={() => {
              setSkipVote(prev => !prev);
              setSelectedIds(new Set());
            }}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-[2rem] border-2 transition-all ${
              skipVote
                ? 'bg-destructive/10 border-destructive/50 text-destructive'
                : 'bg-white premium-shadow border-border/50 hover:border-destructive/30 text-muted-foreground'
            }`}
          >
            <X className="w-4 h-4" />
            SKIP VOTE (NOBODY)
          </button>
        )}

        {!hasVoted && (
          <button
            onClick={handleVote}
            disabled={selectedIds.size === 0 && !skipVote}
            className="w-full pill-button bg-primary text-primary-foreground accent-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SUBMIT VOTE{selectedIds.size > 1 ? `S (${selectedIds.size})` : ''}
            <Vote className="w-5 h-5" />
          </button>
        )}

        {hasVoted && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.3em]">
              WAITING FOR OTHERS ({votedCount}/{players.length})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
