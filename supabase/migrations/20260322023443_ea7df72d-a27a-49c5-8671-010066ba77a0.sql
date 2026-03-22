
ALTER TABLE public.games
ADD COLUMN difficulty text NOT NULL DEFAULT 'medium',
ADD COLUMN imposter_count integer NOT NULL DEFAULT 1;
