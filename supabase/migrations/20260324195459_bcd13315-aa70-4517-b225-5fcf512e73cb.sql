
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS imposter_min integer NOT NULL DEFAULT 1;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS imposter_max integer NOT NULL DEFAULT 1;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS imposter_random boolean NOT NULL DEFAULT false;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS clue_rounds integer NOT NULL DEFAULT 1;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS has_voted boolean NOT NULL DEFAULT false;
