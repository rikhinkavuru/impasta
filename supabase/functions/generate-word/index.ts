import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { difficulty, excludeWords } = await req.json()
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const difficultyDescriptions = {
      easy: "a clue that is very close to the word",
      medium: "a clue that is somewhat related to the word",
      hard: "a clue that is loosely connected to the word",
    }

    const excludedWordsList = Array.isArray(excludeWords) ? excludeWords.join(", ") : ""
    const prompt = `Generate a single word-clue pair for the game "Imposter" (similar to Among Us).

Requirements:
- The word should be a common noun (singular, lowercase)
- The word should NOT be any of these already-used words: ${excludedWordsList || "none"}
- Generate a ${difficulty || 'medium'} difficulty clue: ${difficultyDescriptions[difficulty || 'medium']}
- The clue should be a single word or short phrase (max 3 words)
- Format your response EXACTLY as: WORD|CLUE

Example response: elephant|large animal

Generate one pair now:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 50,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const [word, clue] = content.split('|').map((s: string) => s.trim())

    if (!word || !clue) {
      throw new Error(`Invalid response format from OpenAI: ${content}`)
    }

    return new Response(
      JSON.stringify({
        word: word.toLowerCase(),
        imposterClue: clue.split(/\s+/)[0] || clue,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
