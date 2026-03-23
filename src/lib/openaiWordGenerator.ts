import type { Difficulty } from "./wordBank.types";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function generateWordPairWithAI(
  difficulty: Difficulty = "medium",
  excludeWords: Set<string> = new Set(),
): Promise<{ word: string; imposterClue: string } | null> {
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return null;
  }

  const difficultyDescriptions: Record<Difficulty, string> = {
    easy: "a clue that is very close to the word",
    medium: "a clue that is somewhat related to the word",
    hard: "a clue that is loosely connected to the word",
  };

  const excludedWordsList = Array.from(excludeWords).join(", ");
  const prompt = `Generate a single word-clue pair for the game "Imposter" (similar to Among Us).

Requirements:
- The word should be a common noun (singular, lowercase)
- The word should NOT be any of these already-used words: ${excludedWordsList || "none"}
- Generate a ${difficulty} difficulty clue: ${difficultyDescriptions[difficulty]}
- The clue should be a single word or short phrase (max 3 words)
- Format your response EXACTLY as: WORD|CLUE

Example response: elephant|large animal

Generate one pair now:`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("No content in OpenAI response");
      return null;
    }

    // Parse the response in format "WORD|CLUE"
    const [word, clue] = content.split("|").map((s: string) => s.trim());

    if (!word || !clue) {
      console.error("Invalid response format from OpenAI:", content);
      return null;
    }

    return {
      word: word.toLowerCase(),
      imposterClue: clue.split(/\s+/)[0] || clue, // Take first word of clue
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return null;
  }
}
