const trimTrailingSlash = (value = '') => String(value).replace(/\/+$/, '')

export const getShareBaseUrl = () => {
  const configuredBaseUrl = trimTrailingSlash(import.meta.env.VITE_PUBLIC_APP_URL || '')
  if (configuredBaseUrl) return configuredBaseUrl

  if (typeof window === 'undefined') return ''
  return trimTrailingSlash(window.location.origin)
}

export const buildShareUrl = (shareToken) => `${getShareBaseUrl()}/share/${shareToken}`

export const isLocalOnlyShareBaseUrl = () => {
  const baseUrl = getShareBaseUrl()
  if (!baseUrl) return false

  try {
    const { hostname } = new URL(baseUrl)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

export const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()

  const success = document.execCommand('copy')
  document.body.removeChild(textArea)
  return success
}
