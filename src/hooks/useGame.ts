import { useState, useEffect, useCallback } from 'react';
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

  // Mock fetchPlayers for Lovable Cloud (simulates loading)
  const fetchPlayers = async (gameId: string) => {
    console.log('� Mock fetching players for game:', gameId);
    // In Lovable Cloud, players are managed locally
    // This function exists for compatibility but doesn't make API calls
  };

  // Mock database operations for Lovable Cloud
  const mockUpdate = async (updates: any) => {
    console.log('🔄 Mock update:', updates);
    return Promise.resolve();
  };

  const createGame = useCallback(async (hostName: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🎮 Creating game with host:', hostName);
      const code = generateGameCode();
      
      // Mock game creation for Lovable Cloud
      const gameData = {
        id: `mock-${Date.now()}`,
        code,
        host_player_id: `mock-host-${Date.now()}`,
        phase: 'lobby' as GamePhase,
        word: null,
        imposter_clue: null,
        current_turn_index: 0,
        difficulty: 'medium' as Difficulty,
        imposter_count: 1,
        imposter_min: 1,
        imposter_max: 1,
        imposter_random: false,
      };

      const playerData = {
        id: `mock-player-${Date.now()}`,
        game_id: gameData.id,
        name: hostName,
        is_host: true,
        is_imposter: false,
        clue: null,
        vote_for: null,
        turn_order: 0,
        score: 0,
      };

      setGame(gameData as Game);
      setCurrentPlayerId(playerData.id);
      setPlayers([playerData as Player]);
      console.log('✅ Game created successfully');
    } catch (e: unknown) {
      console.error('❌ Create game error:', e);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const joinGame = useCallback(async (code: string, playerName: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🎮 Joining game:', code, playerName);
      
      // Mock game joining for Lovable Cloud
      const gameData = {
        id: `mock-${Date.now()}`,
        code,
        host_player_id: `mock-host-${Date.now()}`,
        phase: 'lobby' as GamePhase,
        word: null,
        imposter_clue: null,
        current_turn_index: 0,
        difficulty: 'medium' as Difficulty,
        imposter_count: 1,
        imposter_min: 1,
        imposter_max: 1,
        imposter_random: false,
      };

      const playerData = {
        id: `mock-player-${Date.now()}`,
        game_id: gameData.id,
        name: playerName,
        is_host: false,
        is_imposter: false,
        clue: null,
        vote_for: null,
        turn_order: 0,
        score: 0,
      };

      setGame(gameData as Game);
      setCurrentPlayerId(playerData.id);
      setPlayers([playerData as Player]);
      console.log('✅ Joined game successfully');
    } catch (e: unknown) {
      console.error('❌ Join game error:', e);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (settings: GameSettings) => {
    if (!game || !isHost) return;
    console.log('⚙️ Updating settings:', settings);
    await mockUpdate(settings);
  }, [game, isHost]);

  const startGame = useCallback(async (customWord?: string, customClue?: string) => {
    if (!game || !isHost) return;

    console.log('🎲 Starting game...');
    
    // Mock word selection
    const wordPair = customWord && customClue
      ? { word: customWord, imposterClue: normalizeImposterClueToOneWord(customClue) }
      : await getRandomWordPair('medium');

    const playerIds = players.map(p => p.id);
    const imposterPickOrder = shuffleArray(playerIds);
    const clueOrder = shuffleArray(playerIds);

    const n = players.length;
    const numImposters = 1; // Fixed for simplicity

    const imposterIds = new Set(imposterPickOrder.slice(0, numImposters));

    // Update players with roles and turn order
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      turn_order: clueOrder[index],
      is_imposter: imposterIds.has(clueOrder[index]),
      clue: null,
      vote_for: null,
    }));

    setPlayers(updatedPlayers);

    // Update game state
    const updatedGame = {
      ...game,
      phase: 'role_reveal' as GamePhase,
      word: wordPair.word,
      imposter_clue: wordPair.imposterClue,
      current_turn_index: 0,
    };

    setGame(updatedGame);
      civiliansWin: imposterCaught, 
      impostersWin: !imposterCaught && !noImposters,
      noImposters,
      imposterNames: imposters.map(p => p.name)
    });

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
    
    console.log('📊 Final Scores:', updatedPlayers.map(p => ({ 
      name: p.name, 
      oldScore: players.find(pl => pl.id === p.id)?.score || 0, 
      newScore: p.score, 
      change: scoreUpdates[p.id] || 0 
    })));
    setPlayers(updatedPlayers);

    // For Lovable Cloud, work with local state only
    console.log('✅ Leaderboard updated!');
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
