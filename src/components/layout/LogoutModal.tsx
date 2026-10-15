import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { useAuth } from '../../features/auth/authContext'

export default function LogoutModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Modal
      compact
      title="Log out of SkillCred?"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleLogout}>Log out</Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">You&apos;ll need to log in again to see your profile and claims.</p>
    </Modal>
  )
}
