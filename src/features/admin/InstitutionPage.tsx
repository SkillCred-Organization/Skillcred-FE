import { useState } from 'react'
import { Building2, Pencil, Plus, Upload, UserPlus } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/toastContext'
import { adminApi, type Programme } from '../../lib/admin'
import { trackEvent } from '../../lib/analytics'
import { useInstitution } from './adminContext'
import { ErrorNotice, PageHeading, Panel, PersonAvatar, Unavailable } from './AdminUI'

function ProgrammeEditor({ programmes, index, close, saved }: { programmes: Programme[]; index: number; close: () => void; saved: () => void }) {
  const current = programmes[index]
  const [name, setName] = useState(current?.name || '')
  const [cohorts, setCohorts] = useState(current?.cohorts.join('\n') || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    if (programmes.some((programme, other) => other !== index && programme.name.toLowerCase() === name.trim().toLowerCase())) { setError('A programme with this name already exists.'); return }
    const updated = programmes.map(({ name, cohorts }) => ({ name, cohorts }))
    const value = { name: name.trim(), cohorts: [...new Set(cohorts.split('\n').map(cohort => cohort.trim()).filter(Boolean))] }
    if (value.cohorts.length > 30 || value.cohorts.some(cohort => cohort.length > 60)) { setError('Add up to 30 cohorts, with no more than 60 characters each.'); return }
    if (!current && programmes.length >= 50) { setError('You can add up to 50 programmes.'); return }
    if (current) updated[index] = value
    else updated.push(value)
    setBusy(true); setError('')
    try { await adminApi.saveInstitution({ programmes: updated }); trackEvent('programme_saved'); toast.success(current ? 'Programme updated.' : 'Programme added.'); saved() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save programme.') }
    finally { setBusy(false) }
  }
  return <Modal compact title={current ? 'Edit programme' : 'Add programme'} onClose={() => { if (!busy) close() }} footer={<><Button variant="outline" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" form="programme-editor" loading={busy}>{current ? 'Save changes' : 'Add programme'}</Button></>}><form id="programme-editor" className="workspace-form" onSubmit={submit}><ErrorNotice message={error} /><Input label="Programme name" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={100} disabled={busy} /><label>Cohorts (one per line)<textarea value={cohorts} onChange={event => setCohorts(event.target.value)} placeholder="2026 Cohort 1" disabled={busy} /></label><Unavailable>Track and duration fields are not available yet. You can save the programme name and cohorts.</Unavailable></form></Modal>
}

export default function InstitutionPage() {
  const { institution, team, myRole, reloadInstitution } = useInstitution()
  const owner = myRole === 'owner'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const toast = useToast()
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !owner) return
    const data = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try { await adminApi.saveInstitution({ name: String(data.get('name')).trim(), about: String(data.get('about')).trim(), registrationNumber: String(data.get('registrationNumber')).trim() }); trackEvent('institution_updated'); toast.success('Institution details saved.'); reloadInstitution() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save institution details.') }
    finally { setBusy(false) }
  }
  return <><PageHeading title="Institution" description="Manage your institution’s details, programmes and team." back="/admin/profile" /><div className="institution-content workspace-stack"><Panel><form className="workspace-form" onSubmit={save}><ErrorNotice message={error} />{!owner && <Unavailable>Only the institution owner can change these details.</Unavailable>}<div className="photo-control"><span className="institution-logo"><Building2 size={30} /></span><Button variant="outline" icon={<Upload size={16} />} disabled>Change logo</Button></div><Unavailable>Logo uploads are not available yet.</Unavailable><div className="workspace-form-columns"><Input label="Institution name" name="name" defaultValue={institution.name} required minLength={2} maxLength={120} disabled={!owner || busy} /><Input label="Website" value={institution.website} readOnly helperText="Contact support to change your website domain." /></div><label>About<textarea name="about" defaultValue={institution.about || ''} maxLength={500} disabled={!owner || busy} placeholder="Tell learners about your institution." /></label><Input label="Registration number (optional)" name="registrationNumber" defaultValue={institution.registrationNumber || ''} maxLength={60} disabled={!owner || busy} /><Button className="self-start" type="submit" loading={busy} disabled={!owner}>Save changes</Button></form></Panel><Panel><div className="panel-heading"><div><h2>Programmes</h2><p>Programmes learners can link to their profile.</p></div><Button icon={<Plus size={18} />} variant="outline" disabled={!owner} onClick={() => setEditing(-1)}>Add programme</Button></div>{institution.programmes.length ? institution.programmes.map((programme, index) => <div key={programme.name} className="programme-row"><div><h3>{programme.name}</h3><p>{programme.cohorts.join(' · ') || 'No cohorts added'} · {programme.learners || 0} learners</p></div><Button variant="ghost" aria-label={`Edit ${programme.name}`} disabled={!owner} onClick={() => setEditing(index)} icon={<Pencil size={16} />}>Edit</Button></div>) : <p className="workspace-note">No programmes yet. Add your first programme to get started.</p>}</Panel><Panel><div className="panel-heading"><div><h2>Team</h2><p>Admins who can review learner claims.</p></div><Button variant="outline" icon={<UserPlus size={18} />} disabled>Invite admin</Button></div>{team.map(member => <div className="team-row" key={member.id}><PersonAvatar name={member.fullName} /><div><h3>{member.fullName}</h3><p>{member.email}</p></div><span className="member-role">{member.institutionRole === 'owner' ? 'Owner' : 'Reviewer'}</span></div>)}<Unavailable>Admin invitations are not available yet. Contact support if your institution needs another reviewer.</Unavailable></Panel></div>{editing !== null && <ProgrammeEditor programmes={institution.programmes} index={editing} close={() => setEditing(null)} saved={() => { setEditing(null); reloadInstitution() }} />}</>
}
