export function parseList(value) {
  return (value || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
}

function readEnvValue(...keys) {
  for (const key of keys) {
    const value = process.env?.[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return null
}

export function isAllowedEmail(email) {
  const em = (email || '').toLowerCase()
  const allowlist = parseList(
    readEnvValue('TEAM_EMAIL_ALLOWLIST', 'NEXT_PUBLIC_TEAM_EMAIL_ALLOWLIST')
  )
  const domains = parseList(
    readEnvValue('TEAM_EMAIL_DOMAINS', 'NEXT_PUBLIC_TEAM_EMAIL_DOMAINS') ||
      'glassbox.com,glassbox.studio'
  )

  if (allowlist.length && allowlist.includes(em)) return true
  if (domains.length && domains.some((d) => em.endsWith(`@${d}`))) return true
  // Default: if no config provided, deny non-allowlisted users
  return false
}

