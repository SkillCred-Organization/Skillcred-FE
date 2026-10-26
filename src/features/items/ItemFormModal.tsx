import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../../components/ui/Button'
import InlineAlert from '../../components/ui/InlineAlert'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { addItem, updateItem } from '../../lib/api'
import type { ItemKind } from '../../lib/api'
import { errorText } from '../../lib/errors'
import { isHttpsUrl, LINK_MESSAGE } from '../../lib/validators'
import type { LearnerItem, NewLearnerItem } from '../../types'

export type FormCopy = {
  noun: string
  issuerLabel: string
  issuerPlaceholder: string
  dateLabel: string
}

type ItemFormModalProps = {
  kind: ItemKind
  copy: FormCopy
  item?: LearnerItem
  onClose: () => void
  onSaved: (item: LearnerItem, wasEdit: boolean) => void
}

export default function ItemFormModal({ kind, copy, item, onClose, onSaved }: ItemFormModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewLearnerItem>({
    mode: 'onTouched',
    defaultValues: item
      ? { title: item.title, issuer: item.issuer, date: item.date.slice(0, 10), link: item.link }
      : undefined,
  })

  const submit = handleSubmit(async (values) => {
    setSaving(true)
    setError('')
    try {
      const saved = item ? await updateItem(kind, item.id, values) : await addItem(kind, values)
      onSaved(saved, Boolean(item))
      onClose()
    } catch (err) {
      setSaving(false)
      setError(errorText(err, `Couldn't save your ${copy.noun}. Check your connection and try again.`))
    }
  })

  return (
    <Modal
      title={item ? `Edit ${copy.noun}` : `Add a ${copy.noun}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={submit}>{item ? 'Save changes' : `Add ${copy.noun}`}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <InlineAlert variant="error" title={`Couldn't save your ${copy.noun}`}>
            {error}
          </InlineAlert>
        )}
        <Input label="Title" error={errors.title?.message} {...register('title', { required: 'Add a title' })} />
        <Input
          label={copy.issuerLabel}
          placeholder={copy.issuerPlaceholder}
          maxLength={120}
          error={errors.issuer?.message}
          {...register('issuer', { required: `Add ${copy.issuerLabel.toLowerCase()}` })}
        />
        <Input
          label={copy.dateLabel}
          type="date"
          error={errors.date?.message}
          {...register('date', { required: 'Add a date' })}
        />
        <Input
          label="Link (optional)"
          placeholder="https://"
          helperText="A link to the certificate or proof. You need one to ask for verification."
          error={errors.link?.message}
          {...register('link', { validate: (v) => !v || isHttpsUrl(v) || LINK_MESSAGE })}
        />
      </div>
    </Modal>
  )
}