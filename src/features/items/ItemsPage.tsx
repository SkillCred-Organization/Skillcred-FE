import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ChoiceChip from '../../components/ui/ChoiceChip'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/toastContext'
import { deleteItem, getItems, requestItemVerification, withdrawItem } from '../../lib/api'
import type { ItemKind } from '../../lib/api'
import { errorText, needsInstitution } from '../../lib/errors'
import { formatMonth } from '../../lib/format'
import type { LearnerItem, Status } from '../../types'
import ChooseInstitutionModal from '../projects/ChooseInstitutionModal'
import ItemFormModal from './ItemFormModal'
import type { FormCopy } from './ItemFormModal'

export type ItemsCopy = FormCopy & {
  kind: ItemKind
  title: string
  subtitle: string
  icon: LucideIcon
  emptyTitle: string
  emptyMessage: string
}

type Filter = 'all' | Status

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'self-reported', label: 'Self-reported' },
  { value: 'needs-changes', label: 'Needs changes' },
]

export default function ItemsPage({ copy }: { copy: ItemsCopy }) {
  const toast = useToast()
  const Icon = copy.icon
  const [items, setItems] = useState<LearnerItem[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [form, setForm] = useState<{ item?: LearnerItem } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [choosingFor, setChoosingFor] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<LearnerItem | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getItems(copy.kind)
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [copy.kind, attempt])

  const replace = (updated: LearnerItem) =>
    setItems((list) => (list ?? []).map((i) => (i.id === updated.id ? updated : i)))

  async function send(id: string, institutionId?: string) {
    const updated = await requestItemVerification(copy.kind, id, institutionId)
    replace(updated)
    toast.success('Sent to your institution for verification.')
  }

  async function handleRequest(id: string) {
    setBusyId(id)
    try {
      await send(id)
    } catch (err) {
      if (needsInstitution(err)) setChoosingFor(id)
      else toast.error(errorText(err, "Couldn't send this. Please try again."))
    } finally {
      setBusyId(null)
    }
  }

  async function handleWithdraw(id: string) {
    setBusyId(id)
    try {
      replace(await withdrawItem(copy.kind, id))
      toast.success('Request withdrawn.')
    } catch (err) {
      toast.error(errorText(err, "Couldn't withdraw this. Please try again."))
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteItem(copy.kind, deleting.id)
      setItems((list) => (list ?? []).filter((i) => i.id !== deleting.id))
      toast.success('Deleted.')
      setDeleting(null)
    } catch (err) {
      toast.error(errorText(err, "Couldn't delete this. Please try again."))
    } finally {
      setDeleteBusy(false)
    }
  }

  const addButton = (
    <Button icon={<Plus className="size-4" />} onClick={() => setForm({})}>
      Add {copy.noun}
    </Button>
  )
  const countFor = (f: Filter) => (items ? items.filter((i) => f === 'all' || i.status === f).length : undefined)
  const visible = (items ?? []).filter((i) => filter === 'all' || i.status === filter)
  const capital = copy.noun.charAt(0).toUpperCase() + copy.noun.slice(1)

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{copy.title}</h1>
          <p className="text-sm text-ink-muted">{copy.subtitle}</p>
        </div>
        {addButton}
      </header>

      {error ? (
        <EmptyState
          icon={TriangleAlert}
          title="Something went wrong"
          message="It's on our side. Please try again in a moment."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setError(false)
                setItems(null)
                setAttempt((a) => a + 1)
              }}
            >
              Retry
            </Button>
          }
        />
      ) : items === null ? (
        <div role="status" aria-label={`Loading ${copy.title.toLowerCase()}`} className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-4 rounded-xl border border-line bg-white p-4">
              <Skeleton className="size-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={copy.icon} title={copy.emptyTitle} message={copy.emptyMessage} action={addButton} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <ChoiceChip
                key={f.value}
                label={f.label}
                count={countFor(f.value)}
                selected={filter === f.value}
                onClick={() => setFilter(f.value)}
              />
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Nothing with this status.</p>
          ) : (
            <ul className="space-y-3">
              {visible.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-white p-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cream text-ink-muted">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                      <Badge status={item.status} />
                    </div>
                    <p className="text-sm text-ink-muted">
                      {[item.issuer, formatMonth(item.date)].filter(Boolean).join(' · ')}
                    </p>
                    {item.status === 'needs-changes' && item.decision && (
                      <p className="mt-1 text-xs text-error">
                        {[item.decision.reason, item.decision.message].filter(Boolean).join(': ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.actions.requestVerification && (
                      <Button variant="outline" size="sm" loading={busyId === item.id} onClick={() => handleRequest(item.id)}>
                        Request verification
                      </Button>
                    )}
                    {item.actions.withdraw && (
                      <Button variant="outline" size="sm" loading={busyId === item.id} onClick={() => handleWithdraw(item.id)}>
                        Withdraw
                      </Button>
                    )}
                    {item.actions.edit && (
                      <button
                        type="button"
                        aria-label={`Edit ${item.title}`}
                        onClick={() => setForm({ item })}
                        className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-cream"
                      >
                        <Pencil className="size-4" />
                      </button>
                    )}
                    {item.actions.delete && (
                      <button
                        type="button"
                        aria-label={`Delete ${item.title}`}
                        onClick={() => setDeleting(item)}
                        className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-cream"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {form && (
        <ItemFormModal
          kind={copy.kind}
          copy={copy}
          item={form.item}
          onClose={() => setForm(null)}
          onSaved={(saved, wasEdit) => {
            if (wasEdit) replace(saved)
            else setItems((list) => [saved, ...(list ?? [])])
            toast.success(wasEdit ? 'Changes saved.' : `${capital} added.`)
          }}
        />
      )}

      {choosingFor && (
        <ChooseInstitutionModal
          onClose={() => setChoosingFor(null)}
          onSend={(institutionId) => send(choosingFor, institutionId)}
        />
      )}

      {deleting && (
        <Modal
          title={`Delete this ${copy.noun}?`}
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button loading={deleteBusy} onClick={confirmDelete}>Delete</Button>
            </>
          }
        >
          <p className="text-sm text-ink-muted">{deleting.title} will be removed from your profile. This can&apos;t be undone.</p>
        </Modal>
      )}
    </div>
  )
}