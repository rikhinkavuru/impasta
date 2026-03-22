-- When true, imposter count is rolled between imposter_min and imposter_max each round.
-- When false, both are equal and that count is used every round.
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS imposter_random boolean NOT NULL DEFAULT false;

UPDATE public.games
SET imposter_random = (imposter_min <> imposter_max);
