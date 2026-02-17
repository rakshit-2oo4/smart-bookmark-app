'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  created_at: string
}

interface Props {
  userId: string
  onAdd: (bookmark: Bookmark) => void
  onCancel: () => void
}

export default function AddBookmarkForm({ userId, onAdd, onCancel }: Props) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Auto-fetch title from URL (best-effort)
  const handleUrlBlur = async () => {
    if (!url || title) return
    try {
      const cleanUrl = url.startsWith('http') ? url : `https://${url}`
      const hostname = new URL(cleanUrl).hostname.replace('www.', '')
      setTitle(hostname)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    try {
      new URL(normalizedUrl)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)

    const { data, error: insertError } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        url: normalizedUrl,
        title: title.trim(),
      })
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    if (data) {
      onAdd(data as Bookmark)
      setUrl('')
      setTitle('')
    }
  }

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: 'var(--color-card)',
        borderColor: 'var(--color-accent)',
        boxShadow: '0 4px 24px rgba(200, 80, 42, 0.08)',
      }}
    >
      <h3
        className="text-base font-semibold mb-4"
        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
      >
        Add New Bookmark
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="url"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--color-muted)' }}
          >
            URL
          </label>
          <input
            id="url"
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-field"
            style={{
              background: 'var(--color-paper)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)',
            }}
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--color-muted)' }}
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="Give it a memorable name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-field"
            style={{
              background: 'var(--color-paper)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {error && (
          <p
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626' }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm btn-primary"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent"
                  style={{
                    borderColor: 'rgba(255,255,255,0.4)',
                    borderTopColor: 'white',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                Saving...
              </span>
            ) : (
              'Save Bookmark'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm border transition-all"
            style={{
              color: 'var(--color-muted)',
              borderColor: 'var(--color-border)',
              background: 'transparent',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
