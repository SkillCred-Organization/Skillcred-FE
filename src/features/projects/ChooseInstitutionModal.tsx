import { useState } from 'react'
import Button from '../../components/ui/Button'
import InlineAlert from '../../components/ui/InlineAlert'
import Modal from '../../components/ui/Modal'
import { errorText } from '../../lib/errors'
import type { Institution } from '../../types'
import InstitutionPicker from '../onboarding/InstitutionPicker'

type ChooseInstitutionModalProps = {
  onClose: () => void
  onSend: (institutionId: string) => Promise<void>
}

export default function ChooseInstitutionModal({ onClose, onSend }: ChooseInstitutionModalProps) {
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!institution?.id) {
      setError('Choose an institution from the list first.')
      return
    }
    setSending(true)
    setError('')
    try {
      await onSend(institution.id)
      onClose()
    } catch (err) {
      setSending(false)
      setError(errorText(err, "Couldn't send this project. Please try again."))
    }
  }

  return (
    <Modal
      title="Choose who verifies this"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={sending} onClick={send}>Send for verification</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Your profile isn&apos;t linked to an institution yet. Choose the one that should review this project.
        </p>
        <InstitutionPicker value={institution} onChange={setInstitution} allowUnlisted={false} />
        <p className="text-xs text-ink-muted">
          Not on the list? It can&apos;t be verified until your institution joins SkillCred.
        </p>
        {error && (
          <InlineAlert variant="error" title="Couldn't send this project">
            {error}
          </InlineAlert>
        )}
      </div>
    </Modal>
  )
}