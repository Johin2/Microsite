import { NextResponse } from 'next/server'

const GROUP_PREFIXES = ['(app)', '(marketing)']

export function middleware(request) {
  const { pathname } = request.nextUrl

  for (const group of GROUP_PREFIXES) {
    const segment = `/${group}`
    if (pathname === segment || pathname.startsWith(`${segment}/`)) {
      const targetPath = pathname.replace(segment, '') || '/'
      const url = request.nextUrl.clone()
      url.pathname = targetPath.startsWith('/') ? targetPath : `/${targetPath}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/\(app\)', '/\(app\)/:path*', '/\(marketing\)', '/\(marketing\)/:path*']
}
