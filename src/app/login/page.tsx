import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from '@/components/LoginButton'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, var(--color-accent), transparent)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8"
        style={{
          background: 'radial-gradient(circle, var(--color-accent), transparent)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Bookmark grid decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute border border-current rounded-sm"
            style={{
              width: `${40 + (i % 3) * 20}px`,
              height: `${60 + (i % 4) * 15}px`,
              left: `${(i % 4) * 25}%`,
              top: `${Math.floor(i / 4) * 35}%`,
              transform: `rotate(${(i % 5 - 2) * 3}deg)`,
            }}
          />
        ))}
      </div>

      {/* Main content card */}
      <div
        className="relative z-10 w-full max-w-md animate-fade-in-up"
        style={{ animationDelay: '0.1s', opacity: 0 }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-accent)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="white" />
              </svg>
            </div>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Markd
            </span>
          </div>

          <h1
            className="text-4xl mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-ink)',
              lineHeight: 1.1,
            }}
          >
            Your bookmarks,
            <br />
            <span style={{ color: 'var(--color-accent)' }}>beautifully saved.</span>
          </h1>

          <p className="text-base" style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Private, real-time synced bookmarks that live where you work. Sign in to get started.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border"
          style={{
            background: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 4px 32px rgba(15, 14, 13, 0.06)',
          }}
        >
          <div className="space-y-4 mb-6">
            {[
              { icon: '🔒', text: 'Private to you — no one else sees your links' },
              { icon: '⚡', text: 'Real-time sync across all your tabs' },
              { icon: '🗑️', text: 'Add and delete bookmarks instantly' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${0.2 + i * 0.08}s`, opacity: 0 }}
              >
                <span className="text-lg">{feature.icon}</span>
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <div
            className="border-t pt-6"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <LoginButton />
            <p
              className="text-xs text-center mt-4"
              style={{ color: 'var(--color-muted)' }}
            >
              No email or password required — Google only
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p
          className="text-center text-xs mt-6 animate-fade-in"
          style={{
            color: 'var(--color-muted)',
            animationDelay: '0.6s',
            opacity: 0,
          }}
        >
          Built with Next.js · Supabase · Tailwind CSS
        </p>
      </div>
    </div>
  )
}
