import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, GraduationCap } from 'lucide-react'
import Button from '../ui/Button'
import AuthPageLayout from './AuthPageLayout'
export default function UserTypePage() {
  const [userType, setUserType] = useState<'learner' | 'institution' | ''>('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  return <AuthPageLayout><section className="auth-panel auth-choice">
    <h1>Which user are you?</h1><p className="auth-description">Choose the account that fits you.</p>
    <form noValidate onSubmit={e => { e.preventDefault(); if (!userType) { setError('Choose an account type to continue.'); return } navigate(userType === 'learner' ? '/signup' : '/institution-signup') }}>
      <fieldset className="auth-choice-grid"><legend className="sr-only">Choose your account type</legend>
        <label className="auth-choice-card">
          <input type="radio" name="userType" value="learner" checked={userType === 'learner'} onChange={() => { setUserType('learner'); setError('') }} />
          <span className="auth-choice-icon"><GraduationCap aria-hidden="true" /></span>
          <span className="auth-choice-title">I’m a learner or graduate</span>
          <span className="auth-choice-text">Add your projects, certifications and skills, and get them verified by your institution.</span>
        </label>
        <label className="auth-choice-card">
          <input type="radio" name="userType" value="institution" checked={userType === 'institution'} onChange={() => { setUserType('institution'); setError('') }} />
          <span className="auth-choice-icon institution"><Building2 aria-hidden="true" /></span>
          <span className="auth-choice-title">I represent an institution</span>
          <span className="auth-choice-text">Review and verify the work your learners add to SkillCred.</span>
        </label>
      </fieldset>
      {error && <p role="alert" className="auth-field-error">{error}</p>}
      <Button type="submit" className="auth-submit">Continue</Button>
    </form>
    <p className="auth-footer">Already have an account? <Link to="/login" className="auth-link">Log in</Link></p>
  </section></AuthPageLayout>
}
