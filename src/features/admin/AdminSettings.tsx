import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../auth/authContext'
import { useInstitution } from './adminContext'
import { EmptyPanel, PageHeading, Panel, Unavailable } from './AdminUI'
import { NotificationPreferences, PasswordSettings } from '../settings/SettingsSections'

export default function AdminSettings() {
  const { user } = useAuth()
  const { team } = useInstitution()
  const member = team.find(member => member.id === user?.id)
  return <><PageHeading title="Settings" description="Manage your account and preferences." back="/admin/profile" /><div className="settings-content workspace-stack"><Panel><div className="workspace-form"><div className="workspace-form-columns"><Input label="Full name" value={user?.fullName || ''} readOnly /><Input label="Job title" value={member?.jobTitle || ''} readOnly /></div><Input label="Work email" value={user?.email || ''} readOnly /><Unavailable>Contact hello@skillcred.app to change your account details or work email.</Unavailable></div></Panel><NotificationPreferences admin email={user?.email} /><PasswordSettings /><Panel className="danger-panel"><div><h2>Leave institution</h2><p>You’ll no longer be able to review its learner claims.</p><Unavailable>Contact support to leave or transfer ownership of your institution.</Unavailable></div><Button variant="outline" disabled>Leave institution</Button></Panel></div></>
}

export function AdminNotifications() {
  return <><PageHeading title="Notifications" description="Updates about your institution and learner claims." /><Panel><EmptyPanel title="Notifications are not available yet"><Bell className="mx-auto mb-4" />You’ll still receive account and claim decision emails. Visit the review queue to see claims waiting for you.</EmptyPanel><div className="workspace-center"><Link className="workspace-button" to="/admin/queue">Open review queue</Link></div></Panel></>
}
