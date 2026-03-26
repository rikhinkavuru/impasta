export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function parseVoteIds(voteFor: string | null): string[] {
  if (!voteFor) return [];
  try {
    const parsed = JSON.parse(voteFor);
    return Array.isArray(parsed) ? parsed : [voteFor];
  } catch {
    return [voteFor];
  }
}

export function parseClues(clue: string | null): string[] {
  if (!clue) return [];
  try {
    const parsed = JSON.parse(clue);
    return Array.isArray(parsed) ? parsed : [clue];
  } catch {
    return [clue];
  }
}

export function hasClueForRound(clue: string | null, round: number): boolean {
  return parseClues(clue).length >= round;
}
