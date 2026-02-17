'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BookmarkCard from './BookmarkCard'
import AddBookmarkForm from './AddBookmarkForm'

interface User {
  id: string
  email: string
  name: string
  avatar: string | null
}

interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  created_at: string
}

interface Props {
  user: User
  initialBookmarks: Bookmark[]
}

export default function BookmarkDashboard({ user, initialBookmarks }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`bookmarks-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          const newBookmark = payload.new as Bookmark
          // RLS already ensures we only receive our own rows.
          // The duplicate check prevents double-adding in the tab that submitted the form.
          setBookmarks((prev) => {
            if (prev.some((b) => b.id === newBookmark.id)) return prev
            return [newBookmark, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          const deleted = payload.old as { id: string }
          setBookmarks((prev) => prev.filter((b) => b.id !== deleted.id))
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete error:', error)
    }
    setDeletingId(null)
  }

  const handleAddBookmark = useCallback((bookmark: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === bookmark.id)) return prev
      return [bookmark, ...prev]
    })
    setShowForm(false)
  }, [])

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      searchQuery === '' ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const avatarInitial = user.name?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(250, 247, 242, 0.85)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-accent)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="white" />
              </svg>
            </div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Markd
            </span>

            {/* Realtime status */}
            <div
              className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
              style={{
                background: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                color: isConnected ? '#16a34a' : 'var(--color-muted)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isConnected ? '#22c55e' : '#9ca3af',
                  animation: isConnected ? 'pulse-subtle 1.5s ease-in-out infinite' : 'none',
                }}
              />
              {isConnected ? 'Live' : 'Connecting...'}
            </div>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {avatarInitial}
                </div>
              )}
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {user.name.split(' ')[0]}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded-lg border transition-all"
              style={{
                color: 'var(--color-muted)',
                borderColor: 'var(--color-border)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-ink)'
                e.currentTarget.style.borderColor = 'var(--color-ink)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-muted)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Page title + stats */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
          <h1
            className="text-3xl mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Your Bookmarks
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {bookmarks.length === 0
              ? 'No bookmarks yet — add your first one below'
              : `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>

        {/* Search + Add bar */}
        <div
          className="flex gap-3 mb-6 animate-fade-in-up"
          style={{ animationDelay: '0.1s', opacity: 0 }}
        >
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: 'var(--color-muted)' }}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm input-field"
              style={{
                background: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm btn-primary whitespace-nowrap"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Add Bookmark
          </button>
        </div>

        {/* Add form (slide in/out) */}
        {showForm && (
          <div className="mb-6 animate-slide-down">
            <AddBookmarkForm
              userId={user.id}
              onAdd={handleAddBookmark}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Bookmarks list */}
        {filteredBookmarks.length === 0 ? (
          <div
            className="text-center py-20 animate-fade-in"
            style={{ color: 'var(--color-muted)' }}
          >
            {searchQuery ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-base font-medium" style={{ color: 'var(--color-ink)' }}>
                  No results for &quot;{searchQuery}&quot;
                </p>
                <p className="text-sm mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">📑</div>
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                  Nothing saved yet
                </p>
                <p className="text-sm">
                  Click &quot;Add Bookmark&quot; to save your first link
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map((bookmark, i) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDelete}
                isDeleting={deletingId === bookmark.id}
                index={i}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
