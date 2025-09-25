export const WHITELISTED_PATHS = ['app/', 'components/', 'lib/', 'tests/']
export const MAX_CHANGED_FILES = 20
export const MAX_CHANGED_LINES = 400
export const MAX_REPAIR_ATTEMPTS = 6
export const MAX_RUN_MINUTES = 45

export function isPathAllowed(path) {
  return WHITELISTED_PATHS.some((allowed) => path.startsWith(allowed))
}

export function validatePatchSummary(files) {
  if (files.length > MAX_CHANGED_FILES) {
    return { ok: false, reason: `Too many files: ${files.length} > ${MAX_CHANGED_FILES}` }
  }

  const totalLines = files.reduce((count, file) => {
    return (
      count +
      file.patch
        .split('\n')
        .filter((line) => line.startsWith('+') || line.startsWith('-'))
        .length
    )
  }, 0)

  if (totalLines > MAX_CHANGED_LINES) {
    return { ok: false, reason: `Patch too large: ${totalLines} lines > ${MAX_CHANGED_LINES}` }
  }

  const invalidPath = files.find((file) => !isPathAllowed(file.path))
  if (invalidPath) {
    return { ok: false, reason: `Path not allowed: ${invalidPath.path}` }
  }

  return { ok: true }
}
