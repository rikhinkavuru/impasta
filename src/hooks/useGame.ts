import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateGameCode, shuffleArray } from '@/lib/gameUtils';
import { getRandomWordPair } from '@/lib/wordBank';

export type GamePhase = 'lobby' | 'role_reveal' | 'clue_giving' | 'voting' | 'results';

export interface Game {
  id: string;
  code: string;
  host_player_id: string | null;
  phase: GamePhase;
  word: string | null;
  imposter_clue: string | null;
  current_turn_index: number;
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
}

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlayer = players.find(p => p.id === currentPlayerId) || null;
  const isHost = currentPlayer?.is_host ?? false;

  // Subscribe to game and player changes
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
          // Refetch all players on any change
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
    if (data) setPlayers(data as Player[]);
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
      setPlayers([playerData as Player]);
    } catch (e: any) {
      setError(e.message);
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const startGame = useCallback(async (customWord?: string, customClue?: string) => {
    if (!game || !isHost) return;
    
    const wordPair = customWord && customClue
      ? { word: customWord, imposterClue: customClue }
      : getRandomWordPair();

    // Assign turn order and pick imposter
    const shuffledIds = shuffleArray(players.map(p => p.id));
    const imposterId = shuffledIds[Math.floor(Math.random() * shuffledIds.length)];

    for (let i = 0; i < shuffledIds.length; i++) {
      await supabase.from('players').update({
        turn_order: i,
        is_imposter: shuffledIds[i] === imposterId,
        clue: null,
        vote_for: null,
      }).eq('id', shuffledIds[i]);
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

    // Check if all players have submitted clues
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

  const submitVote = useCallback(async (votedPlayerId: string) => {
    if (!game || !currentPlayerId) return;
    await supabase.from('players').update({ vote_for: votedPlayerId }).eq('id', currentPlayerId);

    // Check if all players have voted
    const updatedPlayers = players.map(p => p.id === currentPlayerId ? { ...p, vote_for: votedPlayerId } : p);
    const allVoted = updatedPlayers.every(p => p.vote_for);

    if (allVoted) {
      await supabase.from('games').update({ phase: 'results' }).eq('id', game.id);
    }
  }, [game, currentPlayerId, players]);

  const playAgain = useCallback(async () => {
    if (!game || !isHost) return;
    // Reset all players
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
    setError,
  };
}
