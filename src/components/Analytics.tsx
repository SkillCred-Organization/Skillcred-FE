import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsPagePath } from '../lib/analytics'

const measurementId = 'G-BE34JF6T37'
export default function Analytics() {
  const { pathname } = useLocation()
  const lastPath = useRef('')
  useEffect(() => {
    // Keep development and local preview traffic out of production analytics.
    if (!import.meta.env.PROD || ['localhost', '127.0.0.1'].includes(window.location.hostname)) return
    const path = analyticsPagePath(pathname)
    if (lastPath.current === path) return
    lastPath.current = path
    const location = window.location.origin + path
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || []
      // Google's command queue uses an Arguments object, not a dataLayer event object.
      // eslint-disable-next-line prefer-rest-params
      window.gtag = function () { window.dataLayer!.push(arguments) }
      window.gtag('js', new Date())
      window.gtag('config', measurementId, { send_page_view: false, page_location: location, page_referrer: '', allow_google_signals: false, allow_ad_personalization_signals: false })
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
      document.head.append(script)
    }
    window.gtag('set', { page_location: location, page_referrer: '' })
    window.gtag('event', 'page_view', { page_location: location, page_path: path, page_title: 'SkillCred — Your skills. Verified.', page_referrer: '' })
  }, [pathname])
  return null
}
