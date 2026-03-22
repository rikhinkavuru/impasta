-- Range of imposters (inclusive); at game start a random integer in [min, max] is chosen (clamped to player count).
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS imposter_min integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS imposter_max integer NOT NULL DEFAULT 1;

-- Backfill from legacy imposter_count (negative = old "random 0–n"; use wide max, clamped at start)
UPDATE public.games
SET
  imposter_min = CASE WHEN imposter_count < 0 THEN 0 ELSE imposter_count END,
  imposter_max = CASE WHEN imposter_count < 0 THEN 50 ELSE imposter_count END;
