import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkDashboard from '@/components/BookmarkDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial bookmarks server-side
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <BookmarkDashboard
      user={{
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.email ?? 'User',
        avatar: user.user_metadata?.avatar_url ?? null,
      }}
      initialBookmarks={bookmarks ?? []}
    />
  )
}
