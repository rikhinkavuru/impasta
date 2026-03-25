ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_vote_for_fkey;
COMMENT ON COLUMN public.players.vote_for IS 'Now stores JSON array of voted player IDs, e.g. ["id1","id2"]';