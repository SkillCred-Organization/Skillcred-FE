// A real web address: starts with https:// and has a proper site name (github.com, not just github)
export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password
  } catch {
    return false
  }
}

export const LINK_MESSAGE = 'Enter a full link, like https://github.com/you/project'