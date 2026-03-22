export type Difficulty = "easy" | "medium" | "hard";

export interface WordPair {
  word: string;
  clues: { easy: string; medium: string; hard: string };
  category: string;
}
