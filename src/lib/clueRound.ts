export interface ClueTurnPlayer {
  id: string;
  clue: string | null;
  turn_order: number | null;
}

export interface ClueRoundState<TPlayer extends ClueTurnPlayer> {
  sortedPlayers: TPlayer[];
  playerCount: number;
  clueRounds: number;
  currentTurnIndex: number;
  currentRound: number;
  turnInRound: number;
  totalTurns: number;
  activePlayer: TPlayer | null;
}

export type NextClueAction =
  | { type: 'advance_turn'; nextTurnIndex: number }
  | { type: 'next_round'; nextTurnIndex: number }
  | { type: 'start_voting'; nextTurnIndex: number };

export function getClueRoundState<TPlayer extends ClueTurnPlayer>(
  players: TPlayer[],
  clueRounds: number | null | undefined,
  currentTurnIndex: number | null | undefined,
): ClueRoundState<TPlayer> {
  const sortedPlayers = [...players].sort((a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0));
  const playerCount = sortedPlayers.length;
  const normalizedClueRounds = Math.max(1, clueRounds ?? 1);
  const normalizedTurnIndex = Math.max(0, currentTurnIndex ?? 0);
  const turnInRound = playerCount > 0 ? normalizedTurnIndex % playerCount : 0;
  const currentRound = playerCount > 0 ? Math.floor(normalizedTurnIndex / playerCount) + 1 : 1;

  return {
    sortedPlayers,
    playerCount,
    clueRounds: normalizedClueRounds,
    currentTurnIndex: normalizedTurnIndex,
    currentRound,
    turnInRound,
    totalTurns: normalizedClueRounds * playerCount,
    activePlayer: playerCount > 0 ? sortedPlayers[turnInRound] : null,
  };
}

export function getNextClueAction(state: ClueRoundState<ClueTurnPlayer>): NextClueAction {
  const nextTurnIndex = state.currentTurnIndex + 1;

  if (state.playerCount === 0 || nextTurnIndex >= state.totalTurns) {
    return { type: 'start_voting', nextTurnIndex };
  }

  if (nextTurnIndex % state.playerCount === 0) {
    return { type: 'next_round', nextTurnIndex };
  }

  return { type: 'advance_turn', nextTurnIndex };
}