import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/'
}

function tokenMaxAge(expiresAt) {
  if (typeof expiresAt !== 'number') return undefined
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const secondsUntilExpiry = Math.max(0, Math.floor(expiresAt - nowInSeconds))
  return secondsUntilExpiry || 60 * 5
}

export async function POST(request) {
  const { accessToken, refreshToken, expiresAt } = await request.json().catch(() => ({}))

  if (!accessToken || !refreshToken || !expiresAt) {
    return NextResponse.json({ error: 'Missing session tokens' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('sb-access-token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: tokenMaxAge(expiresAt)
  })
  response.cookies.set('sb-refresh-token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('sb-access-token', '', {
    ...COOKIE_OPTIONS,
    maxAge: 0
  })
  response.cookies.set('sb-refresh-token', '', {
    ...COOKIE_OPTIONS,
    maxAge: 0
  })

  return response
}

