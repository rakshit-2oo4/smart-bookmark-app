
-- bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  title       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create an index for fast user-specific queries
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON public.bookmarks(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — users can only access their OWN bookmarks

-- SELECT: user can read only their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: user can insert bookmarks only for themselves
CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: user can delete only their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Enable Realtime on the bookmarks table
-- Go to: Supabase Dashboard > Database > Replication > Source tables
-- Add the `bookmarks` table to the replication publication.
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
