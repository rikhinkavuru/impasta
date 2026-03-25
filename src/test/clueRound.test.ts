import { describe, expect, it } from 'vitest';
import { getClueRoundState, getNextClueAction } from '@/lib/clueRound';

const players = [
  { id: 'p2', clue: null, turn_order: 1 },
  { id: 'p3', clue: null, turn_order: 2 },
  { id: 'p1', clue: null, turn_order: 0 },
];

describe('clue round helpers', () => {
  it('keeps turn order stable and finds the active player', () => {
    const state = getClueRoundState(players, 2, 1);

    expect(state.sortedPlayers.map((player) => player.id)).toEqual(['p1', 'p2', 'p3']);
    expect(state.currentRound).toBe(1);
    expect(state.turnInRound).toBe(1);
    expect(state.activePlayer?.id).toBe('p2');
  });

  it('moves to the next round after the final player in a non-final round', () => {
    const state = getClueRoundState(players, 2, 2);

    expect(getNextClueAction(state)).toEqual({
      type: 'next_round',
      nextTurnIndex: 3,
    });
  });

  it('starts voting after the final clue of the final round', () => {
    const state = getClueRoundState(players, 2, 5);

    expect(getNextClueAction(state)).toEqual({
      type: 'start_voting',
      nextTurnIndex: 6,
    });
  });
});