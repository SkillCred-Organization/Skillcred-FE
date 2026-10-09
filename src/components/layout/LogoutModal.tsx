import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { tokenStore } from '../../lib/apiClient'

export default function LogoutModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()

  function logout() {
    tokenStore.clear()
    localStorage.removeItem('auth_user') // the saved user details, once login stores them
    navigate('/login', { replace: true })
  }

  return (
    <Modal
      title="Log out of SkillCred?"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={logout}>Log out</Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">You&apos;ll need to log in again to see your profile and claims.</p>
    </Modal>
  )
}