import { ChevronLeft, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Input from '../ui/Input'
import Button from '../ui/Button'

export function AuthField(props: ComponentProps<typeof Input>) {
  return <Input {...props} className={`auth-field ${props.className ?? ''}`} />
}
export function AuthSubmit({ busy, children, busyText }: { busy: boolean; children: ReactNode; busyText: string }) {
  return <Button type="submit" loading={busy} className="auth-submit" aria-busy={busy}>{busy ? busyText : children}</Button>
}
export function AuthAlert({ message, detail, focusOnShow = false }: { message?: string; detail?: ReactNode; focusOnShow?: boolean }) {
  const alertRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (message && focusOnShow) alertRef.current?.focus()
  }, [message, focusOnShow])
  if (!message) return null
  return <div ref={alertRef} className="auth-alert" role="alert" tabIndex={focusOnShow ? -1 : undefined}><TriangleAlert aria-hidden="true" /><div><p>{message}</p>{detail && <p>{detail}</p>}</div></div>
}
export function Agreement({ children, error, ...props }: ComponentProps<'input'> & { children: ReactNode; error?: string }) {
  const errorId = useId()
  return <div className="auth-agreement"><label><input {...props} type="checkbox" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} /><span>{children}</span></label>{error && <p id={errorId} className="auth-field-error" role="alert">{error}</p>}</div>
}
export function TermsText() {
  return <>I agree to the <Link className="auth-link" to="/terms" target="_blank" rel="noopener">Terms</Link> and <Link className="auth-link" to="/privacy" target="_blank" rel="noopener">Privacy Policy</Link></>
}
export function BackLink({ to, children = 'Back to log in' }: { to: string; children?: ReactNode }) {
  return <Link className="auth-back" to={to}><ChevronLeft aria-hidden="true" />{children}</Link>
}
export function AuthDivider() { return <div className="auth-divider" aria-hidden="true">or</div> }
