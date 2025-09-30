import { NextResponse } from 'next/server'

import { createSubmission, listSubmissions } from '@/lib/submission-store'
import { createServerSupabaseClient } from '@lib/supabase'

export async function GET() {
  const submissions = await listSubmissions()
  return NextResponse.json({ submissions })
}

export async function POST(request) {
  const payload = await request.json().catch(() => null)

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch (error) {
    console.warn('Unable to create Supabase server client for submissions.', error)
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.warn('Failed to load user session for submissions.', authError)
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const user = authData?.user ?? null
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { name, email: emailInput, details } = payload
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}

  if (typeof details !== 'string') {
    return NextResponse.json({ error: 'details is required.' }, { status: 400 })
  }

  const trimmedDetails = details.trim()
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  const providedEmail = typeof emailInput === 'string' ? emailInput.trim() : ''
  const sessionEmail = typeof user.email === 'string' ? user.email.trim() : ''
  const email = providedEmail || sessionEmail

  const metadataCampaignType =
    typeof metadata.campaignType === 'string' ? metadata.campaignType.trim() : ''
  const metadataCampaignTypeOther =
    typeof metadata.campaignTypeOther === 'string' ? metadata.campaignTypeOther.trim() : ''

  const finalName = trimmedName || metadataCampaignTypeOther || metadataCampaignType || 'Campaign brief'

  if (!email || !trimmedDetails) {
    return NextResponse.json({ error: 'Email and campaign details are required.' }, { status: 422 })
  }

  try {
    const submission = await createSubmission({
      clientName: metadata.clientName ?? metadata.owner ?? finalName,
      email,
      projectTitle: metadataCampaignTypeOther || metadata.campaignType || finalName,
      projectType: Array.isArray(metadata.objectives) ? metadata.objectives.join(', ') : null,
      timeline: metadata.goLiveDate ?? null,
      budget: metadata.budget ?? null,
      projectDescription: trimmedDetails,
      keyMoment: metadata.goLiveDate ?? null,
      additionalNotes: metadata.generalNotes ?? metadata.additionalNotes ?? null,
      referralSource: metadata.ctaFocus ?? null,
      metadata
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Failed to create submission', error)
    return NextResponse.json({ error: 'Unable to save submission.' }, { status: 500 })
  }
}
