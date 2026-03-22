import type { Difficulty, WordPair } from "./wordBank.types";

export type { Difficulty, WordPair } from "./wordBank.types";

let bankPromise: Promise<WordPair[]> | null = null;

async function loadWordBank(): Promise<WordPair[]> {
  if (!bankPromise) {
    bankPromise = import("./wordBank.data").then((m) => m.wordBank);
  }
  return bankPromise;
}

/** Fire-and-forget load so the word list is ready before the host starts a game. */
export function preloadWordBank(): void {
  void loadWordBank();
}

/** Imposter clues are restricted to a single word (first token if host enters a phrase). */
export function normalizeImposterClueToOneWord(clue: string): string {
  const first = clue.trim().split(/\s+/)[0] ?? "";
  return first;
}

export async function getRandomWordPair(
  difficulty: Difficulty = "medium",
): Promise<{ word: string; imposterClue: string }> {
  const bank = await loadWordBank();
  const pair = bank[Math.floor(Math.random() * bank.length)];
  return {
    word: pair.word,
    imposterClue: normalizeImposterClueToOneWord(pair.clues[difficulty]),
  };
}
