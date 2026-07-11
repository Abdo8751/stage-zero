'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { getInvestorRoute } from '@/lib/auth'
import { validateRequired, validateUrl } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { ArrowLeft } from 'lucide-react'

export default function InvestorVerifyPage() {
  const router = useRouter()
  const { user, investor, loading, refresh } = useUser()
  const { showToast } = useToast()

  const [linkedin, setLinkedin] = useState('')
  const [bio, setBio] = useState('')
  const [chequeSize, setChequeSize] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [forceShowForm, setForceShowForm] = useState(false)
  const [editModeFromQuery, setEditModeFromQuery] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setEditModeFromQuery(params.get('edit') === '1' || params.get('mode') === 'resubmit')
  }, [])

  const isEditing = forceShowForm || editModeFromQuery || investor?.verification_status === 'rejected'

  useEffect(() => {
    if (investor) {
      setLinkedin(investor.linkedin_url ?? '')
      setBio(investor.bio ?? '')
      setChequeSize(investor.cheque_size ?? '')
      setLocation(investor.location ?? '')
    }
  }, [investor])

  useEffect(() => {
    if (investor?.verification_status === 'approved') {
      router.push('/browse')
    }
    if (investor?.verification_status === 'pending' && !editModeFromQuery && !forceShowForm) {
      router.push(getInvestorRoute('pending'))
    }
  }, [editModeFromQuery, forceShowForm, investor, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      showToast('Please sign in first.', 'error')
      router.push('/login')
      return
    }

    const errs: Record<string, string> = {}
    const linkedinErr = validateRequired(linkedin, 'LinkedIn URL')
    const bioErr = validateRequired(bio, 'Bio')
    const chequeErr = validateRequired(chequeSize, 'Cheque size')
    const locationErr = validateRequired(location, 'Location')
    const urlErr = validateUrl(linkedin, 'LinkedIn')
    if (linkedinErr) errs.linkedin = linkedinErr
    if (bioErr) errs.bio = bioErr
    if (chequeErr) errs.cheque = chequeErr
    if (locationErr) errs.location = locationErr
    if (urlErr) errs.linkedin = urlErr
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Your session expired. Please sign in again.')
      }

      const payload = {
        linkedin_url: linkedin.trim(),
        bio: bio.trim(),
        cheque_size: chequeSize.trim(),
        location: location.trim(),
      }

      const response = await fetch('/api/investor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { error?: string; success?: boolean }
      if (!response.ok) {
        throw new Error(data.error ?? 'Submit failed')
      }

      showToast('Verification submitted for review', 'success')
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submit failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-text-secondary font-body">Loading...</div>

  // The account setup flow creates an empty investor row after email verification.
  // Treat it as a draft until all review fields have been submitted.
  const hasSubmittedApplication = Boolean(
    investor?.linkedin_url?.trim() &&
    investor?.bio?.trim() &&
    investor?.cheque_size?.trim() &&
    investor?.location?.trim(),
  )
  const isRejected = hasSubmittedApplication && !forceShowForm && investor?.verification_status === 'rejected'

  if (isRejected) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <Card>
          <h1 className="text-2xl text-text-primary font-heading">Verification declined</h1>
          <p className="mt-4 text-text-secondary font-body font-light">Please update your details and resubmit.</p>
          <Button className="mt-6" onClick={() => {
            setLinkedin(investor?.linkedin_url ?? '')
            setBio(investor?.bio ?? '')
            setChequeSize(investor?.cheque_size ?? '')
            setLocation(investor?.location ?? '')
            setForceShowForm(true)
          }}>
            Edit &amp; resubmit
          </Button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 flex items-center gap-1.5 mx-auto text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="mb-5 flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </button>
      <h1 className="text-3xl sm:text-4xl text-text-primary">Investor verification</h1>
      <p className="mt-2 text-text-secondary font-body font-light">Verify your credentials to access startup listings</p>
      {isEditing && (
        <div className="mt-4 rounded-card border border-[rgba(75,124,246,0.22)] bg-[rgba(75,124,246,0.08)] px-4 py-3 text-[13px] text-text-secondary">
          You&apos;re editing a submitted application. Your investor profile will stay in <span className="text-text-primary">pending review</span> after resubmission.
        </div>
      )}

      <Card className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="LinkedIn URL"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            error={errors.linkedin}
          />
          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            error={errors.bio}
          />
          <Input
            label="Typical cheque size"
            value={chequeSize}
            onChange={(e) => setChequeSize(e.target.value)}
            placeholder="e.g. EGP 500K – 2M"
            error={errors.cheque}
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Cairo, Egypt"
            error={errors.location}
          />
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Submitting...' : 'Submit for review'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
