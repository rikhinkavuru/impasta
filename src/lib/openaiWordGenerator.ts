import type { Difficulty } from "./wordBank.types";
import { supabase } from "@/integrations/supabase/client";

export async function generateWordPairWithAI(
  difficulty: Difficulty = "medium",
  excludeWords: Set<string> = new Set(),
): Promise<{ word: string; imposterClue: string } | null> {
  try {
    // Call the secure Supabase Edge Function instead of OpenAI directly
    const { data, error } = await supabase.functions.invoke("generate-word", {
      body: {
        difficulty,
        excludeWords: Array.from(excludeWords),
      },
    });

    if (error) {
      console.error("Edge Function error:", error);
      return null;
    }

    if (!data || !data.word || !data.imposterClue) {
      console.error("Invalid response from Edge Function:", data);
      return null;
    }

    return {
      word: data.word.toLowerCase(),
      imposterClue: data.imposterClue,
    };
  } catch (error) {
    console.error("Error calling word generation function:", error);
    return null;
  }
}
