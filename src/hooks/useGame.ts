import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateGameCode, shuffleArray } from '@/lib/gameUtils';
import { getRandomWordPair, normalizeImposterClueToOneWord, type Difficulty } from '@/lib/wordBank';
import { generateWordPairWithAI } from '@/lib/openaiWordGenerator';

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
  imposter_min: number;
  imposter_max: number;
  imposter_random: boolean;
  clue_rounds: number;
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
  has_voted: boolean;
}

export interface SessionScore {
  id: string;
  player_id: string;
  score: number;
  rounds_won: number;
  correct_votes: number;
}

export interface GameSettings {
  difficulty: Difficulty;
  imposterRandom: boolean;
  imposterMin: number;
  imposterMax: number;
  clueRounds?: number;
}

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionScores, setSessionScores] = useState<SessionScore[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track words used in this session (reset only when a brand-new game is created)
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

  const currentPlayer = players.find(p => p.id === currentPlayerId) || null;
  const isHost = currentPlayer?.is_host ?? false;

  // Keep a ref to the latest players so callbacks always see fresh data
  const playersRef = useRef<Player[]>(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  // Track used words whenever the game word changes
  useEffect(() => {
    if (game?.word) {
      setUsedWords(prev => new Set([...prev, game.word!.toLowerCase()]));
    }
  }, [game?.word]);

  // Initialize scores when the game moves into role_reveal (i.e. a new round starts)
  useEffect(() => {
    if (game?.phase === 'role_reveal') {
      setSessionScores(prev => {
        const existingIds = new Set(prev.map(s => s.player_id));
        const newEntries: SessionScore[] = playersRef.current
          .filter(p => !existingIds.has(p.id))
          .map(p => ({ id: p.id, player_id: p.id, score: 0, rounds_won: 0, correct_votes: 0 }));
        return newEntries.length > 0 ? [...prev, ...newEntries] : prev;
      });
    }
  }, [game?.phase]);

  // Compute and persist scores when the game reaches the results phase
  useEffect(() => {
    if (game?.phase !== 'results') return;
    const latestPlayers = playersRef.current;

    const voteCounts: Record<string, number> = {};
    latestPlayers.forEach(p => {
      if (p.vote_for) {
        let votedIds: string[];
        try {
          const parsed = JSON.parse(p.vote_for);
          votedIds = Array.isArray(parsed) ? parsed : [p.vote_for];
        } catch {
          votedIds = [p.vote_for];
        }
        votedIds.forEach(id => {
          voteCounts[id] = (voteCounts[id] || 0) + 1;
        });
      }
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const mostVotedIds = Object.entries(voteCounts)
      .filter(([, v]) => v === maxVotes && v > 0)
      .map(([id]) => id);

    const imposterCaught =
      mostVotedIds.length === 1 &&
      latestPlayers.find(p => p.id === mostVotedIds[0])?.is_imposter === true;
    const civiliansWon = imposterCaught;
    const impostersWon = !imposterCaught;

    setSessionScores(prev =>
      prev.map(score => {
        const player = latestPlayers.find(p => p.id === score.player_id);
        if (!player) return score;

        let pointsToAdd = 0;
        let roundsWonIncrement = 0;
        let correctVotesIncrement = 0;

        if (player.is_imposter) {
          if (impostersWon) {
            pointsToAdd += 10;
            roundsWonIncrement = 1;
          }
        } else {
          if (civiliansWon) {
            pointsToAdd += 5;
            roundsWonIncrement = 1;
          }
        }

        if (!player.is_imposter && player.vote_for) {
          let votedIds: string[];
          try {
            const parsed = JSON.parse(player.vote_for);
            votedIds = Array.isArray(parsed) ? parsed : [player.vote_for];
          } catch {
            votedIds = [player.vote_for];
          }
          const correctVotes = votedIds.filter(id => latestPlayers.find(p => p.id === id)?.is_imposter);
          if (correctVotes.length > 0) {
            pointsToAdd += 3 * correctVotes.length;
            correctVotesIncrement = correctVotes.length;
          }
        }

        if (pointsToAdd === 0) return score;

        return {
          ...score,
          score: score.score + pointsToAdd,
          rounds_won: score.rounds_won + roundsWonIncrement,
          correct_votes: score.correct_votes + correctVotesIncrement,
        };
      })
    );
  }, [game?.phase]);

  useEffect(() => {
    if (!game?.id) return;

    const gameChannel = supabase
      .channel(`game-${game.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${game.id}` },
        (payload) => {
          if (payload.new) setGame(payload.new as Game);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` },
        () => { fetchPlayers(game.id); }
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
    if (data) setPlayers(data as unknown as Player[]);
  };

  const createGame = useCallback(async (hostName: string) => {
    setLoading(true);
    setError(null);
    // Reset used words for a brand-new game session
    setUsedWords(new Set());
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

      setGame({ ...gameData, host_player_id: playerData.id } as unknown as Game);
      setCurrentPlayerId(playerData.id);
      setPlayers([playerData as unknown as Player]);
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

      setGame(gameData as unknown as Game);
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
      imposter_random: settings.imposterRandom,
      imposter_min: settings.imposterMin,
      imposter_max: settings.imposterMax,
      clue_rounds: settings.clueRounds ?? 1,
    }).eq('id', game.id);
  }, [game, isHost]);

  const startGame = useCallback(async (customWord?: string, customClue?: string) => {
    if (!game || !isHost) return;

    const difficulty = (game.difficulty || 'medium') as Difficulty;
    let wordPair: { word: string; imposterClue: string };

    if (customWord && customClue) {
      wordPair = { word: customWord, imposterClue: normalizeImposterClueToOneWord(customClue) };
    } else {
      wordPair = await getRandomWordPair(difficulty);

      if (usedWords.has(wordPair.word.toLowerCase())) {
        console.log(`Word "${wordPair.word}" already used, generating new word with AI...`);
        const aiWordPair = await generateWordPairWithAI(difficulty, usedWords);
        if (aiWordPair) {
          wordPair = aiWordPair;
          console.log(`AI generated new word: "${wordPair.word}"`);
        } else {
          console.warn('AI generation failed, using duplicate word from database');
        }
      }
    }

    const currentPlayers = playersRef.current;
    const playerIds = currentPlayers.map(p => p.id);
    const imposterPickOrder = shuffleArray(playerIds);
    const clueOrder = shuffleArray(playerIds);

    const n = currentPlayers.length;
    let numImposters: number;
    if (game.imposter_random) {
      const min = Math.max(0, Math.min(game.imposter_min, n));
      const max = Math.max(min, Math.min(game.imposter_max, n));
      numImposters = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      numImposters = Math.min(game.imposter_min, n);
    }

    const imposterIds = new Set(imposterPickOrder.slice(0, numImposters));

    for (let i = 0; i < clueOrder.length; i++) {
      await supabase.from('players').update({
        turn_order: i,
        is_imposter: imposterIds.has(clueOrder[i]),
        clue: null,
        vote_for: null,
        has_voted: false,
      }).eq('id', clueOrder[i]);
    }

    await supabase.from('games').update({
      phase: 'role_reveal',
      word: wordPair.word,
      imposter_clue: wordPair.imposterClue,
      current_turn_index: 0,
    }).eq('id', game.id);
  }, [game, isHost, usedWords]);

  const proceedToClues = useCallback(async () => {
    if (!game || !isHost) return;
    await supabase.from('games').update({ phase: 'clue_giving' }).eq('id', game.id);
  }, [game, isHost]);

  const submitClue = useCallback(async (clue: string) => {
    if (!game || !currentPlayerId) return;

    // Write this player's clue to the DB
    await supabase.from('players').update({ clue }).eq('id', currentPlayerId);

    // Fetch fresh game AND player state from DB to avoid stale-closure issues
    const [{ data: freshGameData }, { data: freshPlayers }] = await Promise.all([
      supabase.from('games').select('*').eq('id', game.id).single(),
      supabase.from('players').select('*').eq('game_id', game.id),
    ]);

    if (!freshPlayers || !freshGameData) return;

    const freshClueRounds = (freshGameData as unknown as Game).clue_rounds || 1;
    const totalTurns = freshClueRounds * freshPlayers.length;
    const currentTurnIndex = freshGameData.current_turn_index ?? 0;
    const currentRound = Math.floor(currentTurnIndex / freshPlayers.length);
    const turnInRound = currentTurnIndex % freshPlayers.length;

    // Check if every player in this round has submitted a clue
    // Players are sorted by turn_order; those up to and including turnInRound should have clues
    const sortedFresh = [...freshPlayers].sort(
      (a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0)
    );
    const allSubmittedInThisRound = sortedFresh.every(p => p.clue !== null && p.clue !== '');

    if (allSubmittedInThisRound) {
      const nextTurnIndex = (currentRound + 1) * freshPlayers.length;

      if (nextTurnIndex >= totalTurns) {
        // All rounds complete — move to voting
        await supabase.from('games').update({ phase: 'voting' }).eq('id', game.id);
      } else {
        // Start the next clue round: clear all clues and set turn index to start of next round
        for (const p of freshPlayers) {
          await supabase.from('players').update({ clue: null }).eq('id', p.id);
        }
        await supabase.from('games').update({
          current_turn_index: nextTurnIndex,
        }).eq('id', game.id);
      }
    } else {
      // Advance to the next player's turn within this round
      await supabase.from('games').update({
        current_turn_index: currentTurnIndex + 1,
      }).eq('id', game.id);
    }
  }, [game, currentPlayerId]);

  const submitVote = useCallback(async (votedPlayerIds: string[]) => {
    if (!game || !currentPlayerId) return;

    // Store as JSON array string (empty array = skip vote)
    const voteValue = votedPlayerIds.length > 0 ? JSON.stringify(votedPlayerIds) : null;

    await supabase.from('players').update({
      vote_for: voteValue,
      has_voted: true,
    }).eq('id', currentPlayerId);

    const { data: freshPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id);

    if (freshPlayers) {
      const allVoted = freshPlayers.every(p => (p as unknown as Player).has_voted);
      if (allVoted) {
        await supabase.from('games').update({ phase: 'results' }).eq('id', game.id);
      }
    }
  }, [game, currentPlayerId]);

  const playAgain = useCallback(async () => {
    if (!game || !isHost) return;
    const currentPlayers = playersRef.current;
    for (const p of currentPlayers) {
      await supabase.from('players').update({
        is_imposter: false,
        clue: null,
        vote_for: null,
        turn_order: null,
        has_voted: false,
      }).eq('id', p.id);
    }
    await supabase.from('games').update({
      phase: 'lobby',
      word: null,
      imposter_clue: null,
      current_turn_index: 0,
    }).eq('id', game.id);
  }, [game, isHost]);

  return {
    game,
    players,
    sessionScores,
    currentPlayer,
    currentPlayerId,
    isHost,
    loading,
    error,
    createGame,
    joinGame,
    startGame,
    proceedToClues,
    submitClue,
    submitVote,
    playAgain,
    updateSettings,
    setError,
  };
}
