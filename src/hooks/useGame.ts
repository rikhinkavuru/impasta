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
}

export interface SessionScore {
  id: string;
  game_id: string;
  player_id: string;
  score: number;
  rounds_won: number;
  correct_votes: number;
  created_at: string;
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
  const [sessionScores, setSessionScores] = useState<SessionScore[]>([]);
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
        () => { fetchPlayers(game.id); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_scores', filter: `game_id=eq.${game.id}` },
        () => { fetchSessionScores(game.id); }
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

  const fetchSessionScores = async (gameId: string) => {
    const { data } = await supabase
      .from('session_scores')
      .select('*')
      .eq('game_id', gameId)
      .order('score', { ascending: false });
    if (data) setSessionScores(data as SessionScore[]);
  };

  const initializeScores = useCallback(async () => {
    if (!game || !isHost) return;
    
    // Create score records for all players
    for (const player of players) {
      await supabase.from('session_scores').upsert({
        game_id: game.id,
        player_id: player.id,
        score: 0,
        rounds_won: 0,
        correct_votes: 0,
      }, {
        onConflict: 'game_id,player_id'
      });
    }
  }, [game, isHost, players]);

  const updateScores = useCallback(async () => {
    if (!game) return;

    // Calculate round results
    const imposters = players.filter(p => p.is_imposter);
    const civilians = players.filter(p => !p.is_imposter);
    
    // Count votes for each player
    const voteCounts: Record<string, number> = {};
    players.forEach(p => {
      if (p.vote_for) {
        voteCounts[p.vote_for] = (voteCounts[p.vote_for] || 0) + 1;
      }
    });

    // Find the player with the most votes
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const mostVotedPlayer = maxVotes > 0 ? players.find(p => p.id === Object.entries(voteCounts).find(([_, v]) => v === maxVotes)?.[0]) : null;
    
    // Determine who won this round
    // Civilians win when most voted player is an imposter (imposter was caught)
    // Imposters win when most voted player is a civilian (innocent person was voted out)
    const civiliansWon = mostVotedPlayer && mostVotedPlayer.is_imposter;
    const impostersWon = !civiliansWon;

    console.log('Score calculation:', {
      mostVotedPlayer: mostVotedPlayer?.name,
      mostVotedIsImposter: mostVotedPlayer?.is_imposter,
      civiliansWon,
      impostersWon,
      voteCounts,
      players: players.map(p => ({ name: p.name, is_imposter: p.is_imposter, vote_for: p.vote_for }))
    });

    // Update scores for each player
    for (const player of players) {
      let pointsToAdd = 0;
      let roundsWonIncrement = 0;
      let correctVotesIncrement = 0;

      // Check if player won the round
      if ((civiliansWon && !player.is_imposter) || (impostersWon && player.is_imposter)) {
        pointsToAdd += 2;
        roundsWonIncrement = 1;
      }

      // Check if player voted correctly
      // A correct vote means voting for someone on the opposite team
      if (player.vote_for) {
        const votedPlayer = players.find(p => p.id === player.vote_for);
        if (votedPlayer && votedPlayer.is_imposter !== player.is_imposter) {
          pointsToAdd += 1;
          correctVotesIncrement = 1;
        }
      }

      console.log(`Player ${player.name}:`, {
        is_imposter: player.is_imposter,
        pointsToAdd,
        roundsWonIncrement,
        correctVotesIncrement,
        vote_for: player.vote_for
      });

      // Update the player's score
      if (pointsToAdd > 0) {
        const currentScore = sessionScores.find(s => s.player_id === player.id);
        if (currentScore) {
          await supabase.from('session_scores').update({
            score: currentScore.score + pointsToAdd,
            rounds_won: currentScore.rounds_won + roundsWonIncrement,
            correct_votes: currentScore.correct_votes + correctVotesIncrement,
          }).eq('id', currentScore.id);
        }
      }
    }
  }, [game, players, sessionScores]);

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

    // Initialize scores for this game session
    await initializeScores();
  }, [game, isHost, players, initializeScores]);

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

  const submitVote = useCallback(async (votedPlayerId: string) => {
    if (!game || !currentPlayerId) return;
    await supabase.from('players').update({ vote_for: votedPlayerId }).eq('id', currentPlayerId);

    const updatedPlayers = players.map(p => p.id === currentPlayerId ? { ...p, vote_for: votedPlayerId } : p);
    const allVoted = updatedPlayers.every(p => p.vote_for);

    if (allVoted) {
      await supabase.from('games').update({ phase: 'results' }).eq('id', game.id);
      // Update scores after voting is complete
      await updateScores();
    }
  }, [game, currentPlayerId, players, updateScores]);

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
    game, players, sessionScores, currentPlayer, currentPlayerId, isHost, loading, error,
    createGame, joinGame, startGame, proceedToClues, submitClue, submitVote, playAgain,
    updateSettings, setError, initializeScores, updateScores,
  };
}
