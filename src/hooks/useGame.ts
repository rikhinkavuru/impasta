import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateGameCode, shuffleArray } from '@/lib/gameUtils';
import { getRandomWordPair, normalizeImposterClueToOneWord, type Difficulty } from '@/lib/wordBank';

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export type GamePhase = 'lobby' | 'role_reveal' | 'clue_giving' | 'voting' | 'results';

export interface Game {
  id: string;
  code: string;
  host_player_id: string | null;
  phase: GamePhase;
  word: string | null;
  imposter_clue: string | null;
  current_turn_index: number;
  difficulty: Difficulty;
  imposter_count: number;
  /** When true, count is rolled between min and max each round; when false, min and max are equal = fixed count. */
  imposter_min: number;
  imposter_max: number;
  imposter_random?: boolean;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  is_host: boolean;
  is_imposter: boolean;
  clue: string | null;
  vote_for: string | null;
  turn_order: number | null;
  score: number;
}

export interface GameSettings {
  difficulty: Difficulty;
  imposterRandom: boolean;
  imposterMin: number;
  imposterMax: number;
}

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlayer = players.find(p => p.id === currentPlayerId) || null;
  const isHost = currentPlayer?.is_host ?? false;

  useEffect(() => {
    if (!game?.id) return;

    const gameChannel = supabase
      .channel(`game-${game.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${game.id}` },
        (payload) => {
          if (payload.new) setGame(payload.new as Game);
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` },
        () => { 
          fetchPlayers(game.id); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(gameChannel); };
  }, [game?.id]);

  const fetchPlayers = async (gameId: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .order('turn_order', { ascending: true, nullsFirst: false });
    if (data) {
      const playersWithScores = data.map(p => ({ 
        ...p, 
        score: (p as { score?: number }).score || 0 
      })) as Player[];
      setPlayers(playersWithScores);
    }
  };

  const createGame = useCallback(async (hostName: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = generateGameCode();
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({ code, phase: 'lobby' })
        .select()
        .single();
      if (gameError) throw gameError;

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({ game_id: gameData.id, name: hostName, is_host: true })
        .select()
        .single();
      if (playerError) throw playerError;

      await supabase.from('games').update({ host_player_id: playerData.id }).eq('id', gameData.id);

      setGame({ ...gameData, host_player_id: playerData.id } as Game);
      setCurrentPlayerId(playerData.id);
      setPlayers([{ ...playerData, score: 0 } as Player]);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const joinGame = useCallback(async (code: string, playerName: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      if (gameError) throw new Error('Game not found. Check the code and try again.');
      if (gameData.phase !== 'lobby') throw new Error('Game already in progress.');

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({ game_id: gameData.id, name: playerName })
        .select()
        .single();
      if (playerError) throw playerError;

      setGame(gameData as Game);
      setCurrentPlayerId(playerData.id);
      await fetchPlayers(gameData.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (settings: GameSettings) => {
    if (!game || !isHost) return;
    await supabase.from('games').update({
      difficulty: settings.difficulty,
      imposter_count: settings.imposterMax,
      imposter_min: settings.imposterMin,
      imposter_max: settings.imposterMax,
      imposter_random: settings.imposterRandom,
    }).eq('id', game.id);
  }, [game, isHost]);

  const startGame = useCallback(async (customWord?: string, customClue?: string) => {
    if (!game || !isHost) return;

    const difficulty = (game.difficulty || 'medium') as Difficulty;
    const wordPair = customWord && customClue
      ? { word: customWord, imposterClue: normalizeImposterClueToOneWord(customClue) }
      : await getRandomWordPair(difficulty);

    const playerIds = players.map(p => p.id);
    // Imposter selection and clue order must be independent shuffles, or imposters
    // would always get the first turn_order slots (0..numImposters-1).
    const imposterPickOrder = shuffleArray(playerIds);
    const clueOrder = shuffleArray(playerIds);

    const n = players.length;
    const rawMin = game.imposter_min ?? (game.imposter_count < 0 ? 0 : game.imposter_count);
    const rawMax = game.imposter_max ?? (game.imposter_count < 0 ? n : game.imposter_count);
    const minImposters = Math.max(0, Math.min(rawMin, n));
    const maxImposters = Math.max(minImposters, Math.min(rawMax, n));
    const useRandom =
      game.imposter_random ?? minImposters !== maxImposters;
    const numImposters = useRandom
      ? minImposters + Math.floor(Math.random() * (maxImposters - minImposters + 1))
      : minImposters;

    const imposterIds = new Set(imposterPickOrder.slice(0, numImposters));

    for (let i = 0; i < clueOrder.length; i++) {
      await supabase.from('players').update({
        turn_order: i,
        is_imposter: imposterIds.has(clueOrder[i]),
        clue: null,
        vote_for: null,
      }).eq('id', clueOrder[i]);
    }

    await supabase.from('games').update({
      phase: 'role_reveal',
      word: wordPair.word,
      imposter_clue: wordPair.imposterClue,
      current_turn_index: 0,
    }).eq('id', game.id);
  }, [game, isHost, players]);

  const proceedToClues = useCallback(async () => {
    if (!game || !isHost) return;
    await supabase.from('games').update({ phase: 'clue_giving' }).eq('id', game.id);
  }, [game, isHost]);

  const submitClue = useCallback(async (clue: string) => {
    if (!game || !currentPlayerId) return;
    await supabase.from('players').update({ clue }).eq('id', currentPlayerId);

    const updatedPlayers = players.map(p => p.id === currentPlayerId ? { ...p, clue } : p);
    const allSubmitted = updatedPlayers.every(p => p.clue);

    if (allSubmitted) {
      await supabase.from('games').update({ phase: 'voting' }).eq('id', game.id);
    } else {
      await supabase.from('games').update({
        current_turn_index: (game.current_turn_index || 0) + 1
      }).eq('id', game.id);
    }
  }, [game, currentPlayerId, players]);

  const calculateAndUpdateScores = useCallback(async () => {
    console.log('🎯 calculateAndUpdateScores called!');
    if (!game || !players.length) {
      console.log('❌ No game or players');
      return;
    }

    const imposters = players.filter(p => p.is_imposter);
    const imposterIds = new Set(imposters.map(p => p.id));

    // Count votes
    const voteCounts: Record<string, number> = {};
    players.forEach(p => {
      if (p.vote_for) {
        voteCounts[p.vote_for] = (voteCounts[p.vote_for] || 0) + 1;
      }
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const mostVotedId = Object.entries(voteCounts).find(([_, v]) => v === maxVotes)?.[0];

    // Determine outcome
    const noImposters = imposters.length === 0;
    const imposterCaught = !noImposters && mostVotedId != null && imposterIds.has(mostVotedId);

    console.log('Scoring debug:', { noImposters, imposterCaught, imposters: imposters.map(p => p.name), mostVotedId, voteCounts });

    // Calculate score changes
    const scoreUpdates: Record<string, number> = {};
    
    if (noImposters) {
      // No imposters - everyone gets 1 point
      players.forEach(p => {
        scoreUpdates[p.id] = 1;
      });
    } else if (imposterCaught) {
      // Civilians win - civilians get 2 points, imposters get 0
      players.forEach(p => {
        if (p.is_imposter) {
          scoreUpdates[p.id] = 0;
        } else {
          scoreUpdates[p.id] = 2;
        }
      });
    } else {
      // Imposters win - imposters get 2 points, civilians get 0
      players.forEach(p => {
        if (p.is_imposter) {
          scoreUpdates[p.id] = 2;
        } else {
          scoreUpdates[p.id] = 0;
        }
      });
    }

    // Bonus for correct voting
    players.forEach(p => {
      if (p.vote_for && imposterIds.has(p.vote_for)) {
        scoreUpdates[p.id] = (scoreUpdates[p.id] || 0) + 1;
      }
    });

    console.log('Score updates calculated:', scoreUpdates);

    // Update local state immediately for responsive UI
    const updatedPlayers = players.map(p => ({
      ...p,
      score: (p.score || 0) + (scoreUpdates[p.id] || 0)
    }));
    
    console.log('Players with new scores:', updatedPlayers.map(p => ({ name: p.name, oldScore: players.find(pl => pl.id === p.id)?.score || 0, newScore: p.score, change: scoreUpdates[p.id] || 0 })));
    setPlayers(updatedPlayers);

    // Try to update database in background (don't wait for it)
    for (const [playerId, scoreChange] of Object.entries(scoreUpdates)) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        const newScore = (player.score || 0) + scoreChange;
        
        // Try database update but don't block on it
        supabase
          .from('players')
          .update({ score: newScore } as any)
          .eq('id', playerId)
          .then(({ error }) => {
            if (error) {
              console.log('Database score update failed (column may not exist):', error);
            }
          });
      }
    }
  }, [game, players]);

  const submitVote = useCallback(async (votedPlayerId: string) => {
    console.log('🗳️ submitVote called for:', votedPlayerId);
    if (!game || !currentPlayerId) return;
    await supabase.from('players').update({ vote_for: votedPlayerId }).eq('id', currentPlayerId);

    const updatedPlayers = players.map(p => p.id === currentPlayerId ? { ...p, vote_for: votedPlayerId } : p);
    const allVoted = updatedPlayers.every(p => p.vote_for);

    console.log('📊 All voted?', allVoted, 'Players:', updatedPlayers.map(p => ({ name: p.name, vote_for: p.vote_for })));

    if (allVoted) {
      console.log('🎯 All votes in, calling scoring function...');
      await supabase.from('games').update({ phase: 'results' }).eq('id', game.id);
      // Calculate and update scores when game ends
      await calculateAndUpdateScores();
    } else {
      console.log('⏳ Still waiting for more votes');
    }
  }, [game, currentPlayerId, players, calculateAndUpdateScores]);

  const playAgain = useCallback(async () => {
    if (!game || !isHost) return;
    for (const p of players) {
      await supabase.from('players').update({
        is_imposter: false,
        clue: null,
        vote_for: null,
        turn_order: null,
      }).eq('id', p.id);
    }
    await supabase.from('games').update({
      phase: 'lobby',
      word: null,
      imposter_clue: null,
      current_turn_index: 0,
    }).eq('id', game.id);
  }, [game, isHost, players]);

  return {
    game, players, currentPlayer, currentPlayerId, isHost, loading, error,
    createGame, joinGame, startGame, proceedToClues, submitClue, submitVote, playAgain,
    updateSettings, setError,
  };
}
