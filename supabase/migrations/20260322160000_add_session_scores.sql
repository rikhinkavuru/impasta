-- Create session_scores table for per-lobby leaderboard tracking
CREATE TABLE public.session_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  rounds_won INTEGER NOT NULL DEFAULT 0,
  correct_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

-- Enable RLS
ALTER TABLE public.session_scores ENABLE ROW LEVEL SECURITY;

-- Allow all operations since no auth
CREATE POLICY "Anyone can read session_scores" ON public.session_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert session_scores" ON public.session_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update session_scores" ON public.session_scores FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete session_scores" ON public.session_scores FOR DELETE USING (true);

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_scores;
