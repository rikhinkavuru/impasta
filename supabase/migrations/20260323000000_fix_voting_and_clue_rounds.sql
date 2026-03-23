-- Add clue_rounds to games
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS clue_rounds integer NOT NULL DEFAULT 1;

-- Add has_voted to players to distinguish between 'not voted' and 'voted to skip' (both null in vote_for)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS has_voted boolean NOT NULL DEFAULT false;

-- Reset has_voted for all players
UPDATE public.players SET has_voted = false;
