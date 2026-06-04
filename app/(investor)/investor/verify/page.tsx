'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
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

  useEffect(() => {
    if (investor) {
      setLinkedin(investor.linkedin_url ?? '')
      setBio(investor.bio ?? '')
      setChequeSize(investor.cheque_size ?? '')
      setLocation(investor.location ?? '')
    }
  }, [investor])

  useEffect(() => {
    if (
      investor?.verification_status === 'approved' &&
      user?.is_verified
    ) {
      router.push('/browse')
    }
  }, [investor, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

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
      const payload = {
        linkedin_url: linkedin.trim(),
        bio: bio.trim(),
        cheque_size: chequeSize.trim(),
        location: location.trim(),
        verification_status: 'pending' as const,
      }

      const { error } = investor
        ? await supabase.from('investors').update(payload).eq('user_id', user.id)
        : await supabase.from('investors').insert({ user_id: user.id, credits: 0, ...payload })

      if (error) throw error
      showToast('Verification submitted for review', 'success')
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submit failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-text-secondary font-body">Loading...</div>

  const isPending = investor?.verification_status === 'pending' && !user?.is_verified
  const isRejected = !forceShowForm && investor?.verification_status === 'rejected'

  if (isPending && investor?.linkedin_url) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <Card>
          <h1 className="text-2xl sm:text-3xl text-text-primary font-heading">Verification pending</h1>
          <p className="mt-4 text-text-secondary font-body font-light">
            Your application is under review. We&apos;ll notify you once approved.
          </p>
          <p className="mt-4 text-xs text-text-tertiary font-body font-light">
            To simulate approval: in Supabase, set{' '}
            <code className="text-gold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded font-mono">investors.verification_status</code> to{' '}
            <code className="text-gold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded font-mono">approved</code> and{' '}
            <code className="text-gold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded font-mono">users.is_verified</code> to{' '}
            <code className="text-gold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded font-mono">true</code>.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 flex items-center gap-1.5 mx-auto text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </button>
        </Card>
      </div>
    )
  }

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
