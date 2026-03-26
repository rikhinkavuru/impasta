

## Code Audit: Issues Found and Fix Plan

After reviewing every game-related file, I found several concrete bugs and code smells that explain the "random bugs" you're experiencing.

---

### Critical Bugs

**1. Scoring runs multiple times (double/triple points)**
The scoring logic in `useGame.ts` (line 98) is inside a `useEffect` that triggers whenever `game.phase` changes. But realtime updates continuously set the game state — and since the phase stays `'results'`, every realtime event re-triggers the effect, adding points again and again. There is no guard to prevent this.

**Fix:** Add a `scoredRoundRef` that tracks whether scoring has already been applied for the current round. Only compute scores once per transition to `results`.

**2. Race condition in multi-round clue clearing**
When `submitClue` handles a `next_round` action (line 376-381), it uses `Promise.all` to simultaneously clear all player clues AND update `current_turn_index`. The realtime listener fires for each individual player update, calling `fetchPlayers` multiple times in rapid succession. This causes the UI to see partially-cleared states — some players still showing old clues while the turn index has already moved forward, which can make the input box disappear or show the wrong active player.

**Fix:** Reverse the order — update the turn index first, then clear clues. Better yet, avoid the parallel call and do them sequentially so the game state is consistent when realtime fires.

**3. Unused `imposter_count` field**
The `Game` interface has `imposter_count` but it's never read anywhere. The actual imposter count is derived from `imposter_min`/`imposter_max`/`imposter_random`. This is harmless but adds confusion.

**Fix:** Remove from the interface.

---

### Code Duplication

**4. Vote parsing duplicated 3 times**
The exact same JSON.parse-with-fallback pattern for `vote_for` appears in:
- `useGame.ts` line 105-111 (vote counting)
- `useGame.ts` line 151-157 (correct vote scoring)
- `ResultsScreen.tsx` line 21-27 (display)

**Fix:** Extract a `parseVoteIds(voteFor: string | null): string[]` helper into `gameUtils.ts` and use it everywhere.

---

### Files to Change

| File | Change |
|------|--------|
| `src/lib/gameUtils.ts` | Add `parseVoteIds` helper |
| `src/hooks/useGame.ts` | Add scored-round guard to results effect; fix next_round race condition; use `parseVoteIds`; remove `imposter_count` from interface |
| `src/components/game/ResultsScreen.tsx` | Use `parseVoteIds` |
| `src/components/game/VotingScreen.tsx` | Use `parseVoteIds` |

