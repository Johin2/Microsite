import { NextResponse } from 'next/server'

// No-op middleware. Route groups like (app) or (marketing) are filesystem-only in Next.js
// and never appear in URLs, so we avoid rewriting paths that include parentheses.
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: []
}

