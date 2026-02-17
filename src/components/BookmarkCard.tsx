'use client'

import { useState } from 'react'

interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  created_at: string
}

interface Props {
  bookmark: Bookmark
  onDelete: (id: string) => Promise<void>
  isDeleting: boolean
  index: number
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

export default function BookmarkCard({ bookmark, onDelete, isDeleting, index }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [faviconError, setFaviconError] = useState(false)

  const domain = getDomain(bookmark.url)
  const faviconUrl = getFaviconUrl(bookmark.url)

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(bookmark.id)
    } else {
      setConfirmDelete(true)
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const staggerClass = index < 5 ? `stagger-${index + 1}` : ''

  return (
    <div
      className={`bookmark-card rounded-2xl border px-5 py-4 flex items-center gap-4 group animate-fade-in-up ${staggerClass}`}
      style={{
        background: 'var(--color-card)',
        borderColor: 'var(--color-border)',
        opacity: isDeleting ? 0.5 : 0,
        transition: isDeleting
          ? 'opacity 0.3s ease'
          : 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: '0 1px 4px rgba(15, 14, 13, 0.04)',
      }}
    >
      {/* Favicon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--color-cream)' }}
      >
        {faviconUrl && !faviconError ? (
          <img
            src={faviconUrl}
            alt=""
            width={20}
            height={20}
            onError={() => setFaviconError(true)}
          />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted)' }}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium mb-0.5 truncate transition-colors"
          style={{ color: 'var(--color-ink)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-ink)'
          }}
        >
          {bookmark.title}
        </a>
        <div className="flex items-center gap-2">
          <span
            className="text-xs truncate"
            style={{ color: 'var(--color-muted)' }}
          >
            {domain}
          </span>
          <span style={{ color: 'var(--color-border)' }}>·</span>
          <span
            className="text-xs flex-shrink-0"
            style={{ color: 'var(--color-muted)' }}
          >
            {formatDate(bookmark.created_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Open link */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: 'var(--color-muted)' }}
          title="Open link"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-cream)'
            e.currentTarget.style.color = 'var(--color-ink)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </a>

        {/* Delete */}
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-xs"
          style={{
            color: confirmDelete ? '#dc2626' : 'var(--color-muted)',
            background: confirmDelete ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
          }}
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete bookmark'}
          onMouseEnter={(e) => {
            if (!confirmDelete) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
              e.currentTarget.style.color = '#dc2626'
            }
          }}
          onMouseLeave={(e) => {
            if (!confirmDelete) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-muted)'
            }
          }}
        >
          {isDeleting ? (
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent"
              style={{
                borderColor: 'rgba(220, 38, 38, 0.3)',
                borderTopColor: '#dc2626',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : confirmDelete ? (
            <span className="font-medium">Sure?</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
