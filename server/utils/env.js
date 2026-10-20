/**
 * Sanitizes environment variable strings:
 * - Unwraps any level of single/double quotes or backticks (e.g., '"value"', '\"value\"', "'val'")
 * - Trims whitespaces
 * - Strips trailing slashes if isUrl is true
 */
export function cleanEnv(val, { isUrl = false } = {}) {
  if (val === undefined || val === null) return ''
  let str = String(val).trim()

  let prev = ''
  while (str !== prev && str.length > 0) {
    prev = str
    // Check escaped quotes first
    if (str.startsWith('\\"') && str.endsWith('\\"') && str.length >= 4) {
      str = str.slice(2, -2).trim()
    } else if (str.startsWith("\\'") && str.endsWith("\\'") && str.length >= 4) {
      str = str.slice(2, -2).trim()
    } else if (
      (str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'")) ||
      (str.startsWith('`') && str.endsWith('`'))
    ) {
      str = str.slice(1, -1).trim()
    }
  }

  if (isUrl) {
    str = str.replace(/\/+$/, '')
  }

  return str
}

export function cleanUrl(val) {
  return cleanEnv(val, { isUrl: true })
}
