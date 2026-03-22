-- Add score tracking to players table
ALTER TABLE public.players ADD COLUMN score INTEGER DEFAULT 0;

-- Add round tracking to games table for session history
ALTER TABLE public.games ADD COLUMN round_number INTEGER DEFAULT 1;
ALTER TABLE public.games ADD COLUMN session_id UUID DEFAULT gen_random_uuid();

-- Update existing games to have session_id
UPDATE public.games SET session_id = gen_random_uuid() WHERE session_id IS NULL;
