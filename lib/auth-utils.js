export function parseList(value) {
  return (value || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedEmail(email) {
  const em = (email || '').toLowerCase()
  const allowlist = parseList(process.env.TEAM_EMAIL_ALLOWLIST)
  const domains = parseList(process.env.TEAM_EMAIL_DOMAINS || 'glassbox.com,glassbox.studio')

  if (allowlist.length && allowlist.includes(em)) return true
  if (domains.length && domains.some((d) => em.endsWith(`@${d}`))) return true
  // Default: if no config provided, deny non-allowlisted users
  return false
}

