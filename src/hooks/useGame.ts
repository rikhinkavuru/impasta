import { useState, useEffect, useCallback } from 'react';
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
  vote_for: string | null; // null means skip vote, string means voted for that player
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
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

  const currentPlayer = players.find(p => p.id === currentPlayerId) || null;
  const isHost = currentPlayer?.is_host ?? false;

  // Track used words when game word changes
  useEffect(() => {
    if (game?.word) {
      setUsedWords(prev => new Set([...prev, game.word!.toLowerCase()]));
    }
  }, [game?.word]);

  // Reset used words when returning to lobby
  useEffect(() => {
    if (game?.phase === 'lobby') {
      setUsedWords(new Set());
    }
  }, [game?.id, game?.phase]);

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

  const initializeScores = useCallback(() => {
    if (!game) return;
    // Only initialize if we don't already have scores for these players
    const existingIds = new Set(sessionScores.map(s => s.player_id));
    const newScores: SessionScore[] = [];
    for (const player of players) {
      if (!existingIds.has(player.id)) {
        newScores.push({
          id: player.id,
          player_id: player.id,
          score: 0,
          rounds_won: 0,
          correct_votes: 0,
        });
      }
    }
    if (newScores.length > 0) {
      setSessionScores(prev => [...prev, ...newScores]);
    }
  }, [game, players, sessionScores]);

  const updateScores = useCallback(() => {
    if (!game) return;

    const imposters = players.filter(p => p.is_imposter);
    const voteCounts: Record<string, number> = {};
    players.forEach(p => {
      if (p.vote_for) {
        voteCounts[p.vote_for] = (voteCounts[p.vote_for] || 0) + 1;
      }
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    // Find ALL players who received the maximum number of votes
    const mostVotedIds = Object.entries(voteCounts)
      .filter(([_, v]) => v === maxVotes && v > 0)
      .map(([id, _]) => id);

    // Outcome logic:
    // 1. If multiple people are tied for most votes, nobody is eliminated (Imposters win/get away)
    // 2. If exactly one person is most voted, and they are an imposter, Civilians win
    // 3. If exactly one person is most voted, and they are NOT an imposter, Imposters win
    // 4. If nobody received any votes, Imposters win
    
    const imposterCaught = mostVotedIds.length === 1 && players.find(p => p.id === mostVotedIds[0])?.is_imposter;
    const civiliansWon = imposterCaught;
    const impostersWon = !imposterCaught;

    setSessionScores(prev => {
      return prev.map(score => {
        const player = players.find(p => p.id === score.player_id);
        if (!player) return score;

        let pointsToAdd = 0;
        let roundsWonIncrement = 0;
        let correctVotesIncrement = 0;

        // Points for winning the round
        if (player.is_imposter) {
          if (impostersWon) {
            pointsToAdd += 10; // Imposters get big points for winning
            roundsWonIncrement = 1;
          }
        } else {
          if (civiliansWon) {
            pointsToAdd += 5; // Civilians get points for catching imposter
            roundsWonIncrement = 1;
          }
        }

        // Points for correct individual vote (only for civilians)
        if (!player.is_imposter && player.vote_for) {
          const votedPlayer = players.find(p => p.id === player.vote_for);
          if (votedPlayer && votedPlayer.is_imposter) {
            pointsToAdd += 3; // Bonus for voting correctly
            correctVotesIncrement = 1;
          }
        }

        if (pointsToAdd === 0) return score;

        return {
          ...score,
          score: score.score + pointsToAdd,
          rounds_won: score.rounds_won + roundsWonIncrement,
          correct_votes: score.correct_votes + correctVotesIncrement,
        };
      });
    });
  }, [game, players]);

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
      // Get word from database first
      wordPair = await getRandomWordPair(difficulty);
      
      // Check if word has been used in this session
      if (usedWords.has(wordPair.word.toLowerCase())) {
        // Fallback to AI-generated word
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

    const playerIds = players.map(p => p.id);
    const imposterPickOrder = shuffleArray(playerIds);
    const clueOrder = shuffleArray(playerIds);

    const n = players.length;
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

    // Initialize scores for this game session (in-memory)
    initializeScores();
    
    // Track this word as used
    setUsedWords(prev => new Set([...prev, wordPair.word.toLowerCase()]));
  }, [game, isHost, players, initializeScores, usedWords]);

  const proceedToClues = useCallback(async () => {
    if (!game || !isHost) return;
    await supabase.from('games').update({ phase: 'clue_giving' }).eq('id', game.id);
  }, [game, isHost]);

  const submitClue = useCallback(async (clue: string) => {
    if (!game || !currentPlayerId) return;
    
    // For multiple rounds, we might want to store an array of clues,
    // but the schema only has one 'clue' column. 
    // Let's store the latest one and the UI will show it.
    await supabase.from('players').update({ clue }).eq('id', currentPlayerId);

    const updatedPlayers = players.map(p => p.id === currentPlayerId ? { ...p, clue } : p);
    const allSubmittedInThisRound = updatedPlayers.every(p => p.clue);

    if (allSubmittedInThisRound) {
      const currentTurnIndex = game.current_turn_index || 0;
      const totalTurnsNeeded = players.length * (game.clue_rounds || 1);
      
      if (currentTurnIndex + 1 >= totalTurnsNeeded) {
        await supabase.from('games').update({ phase: 'voting' }).eq('id', game.id);
      } else {
        // Reset clues for the next round if we want them to submit again?
        // Actually, the current turn-based system waits for each player.
        // If we want multiple rounds, we just keep incrementing current_turn_index.
        // The CluePhaseScreen should handle showing the correct state.
        await supabase.from('games').update({
          current_turn_index: currentTurnIndex + 1
        }).eq('id', game.id);
        
        // Clear all clues for the next round
        for (const p of players) {
          await supabase.from('players').update({ clue: null }).eq('id', p.id);
        }
      }
    } else {
      await supabase.from('games').update({
        current_turn_index: (game.current_turn_index || 0) + 1
      }).eq('id', game.id);
    }
  }, [game, currentPlayerId, players]);

  const submitVote = useCallback(async (votedPlayerId: string | null) => {
    if (!game || !currentPlayerId) return;
    
    await supabase.from('players').update({ 
      vote_for: votedPlayerId,
      has_voted: true 
    }).eq('id', currentPlayerId);

    const { data: freshPlayers } = await supabase.from('players').select('*').eq('game_id', game.id);
    if (freshPlayers) {
      const allVoted = freshPlayers.every(p => p.has_voted);
      if (allVoted) {
        await supabase.from('games').update({ phase: 'results' }).eq('id', game.id);
        updateScores();
      }
    }
  }, [game, currentPlayerId, updateScores]);

  const playAgain = useCallback(async () => {
    if (!game || !isHost) return;
    for (const p of players) {
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
    // Keep used words tracking across rounds in the same session
  }, [game, isHost, players]);

  return {
    game, players, sessionScores, currentPlayer, currentPlayerId, isHost, loading, error,
    createGame, joinGame, startGame, proceedToClues, submitClue, submitVote, playAgain,
    updateSettings, setError, initializeScores, updateScores,
  };
}
