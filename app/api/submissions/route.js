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

  const { name, email, details } = payload
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}

  if (typeof name !== 'string' || typeof email !== 'string' || typeof details !== 'string') {
    return NextResponse.json({ error: 'name, email, and details are required.' }, { status: 400 })
  }

  const trimmed = {
    name: name.trim(),
    email: email.trim(),
    details: details.trim()
  }

  if (!trimmed.name || !trimmed.email || !trimmed.details) {
    return NextResponse.json({ error: 'All fields must be provided.' }, { status: 422 })
  }

  const references = Array.isArray(metadata.references)
    ? metadata.references
    : Array.isArray(metadata.attachments)
    ? metadata.attachments
    : []

  try {
    const submission = await createSubmission({
      clientName: metadata.clientName ?? metadata.owner ?? trimmed.name,
      company: metadata.company ?? null,
      email: trimmed.email,
      phone: metadata.phone ?? null,
      projectTitle: metadata.projectTitle ?? trimmed.name,
      projectType: metadata.projectType ?? metadata.categoryHint ?? null,
      timeline: metadata.timeline ?? null,
      budget: metadata.budget ?? null,
      projectDescription: trimmed.details,
      keyMoment: metadata.keyMoment ?? metadata.dueDate ?? null,
      references,
      additionalNotes: metadata.additionalNotes ?? null,
      referralSource: metadata.referralSource ?? null,
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Failed to create submission', error)
    return NextResponse.json({ error: 'Unable to save submission.' }, { status: 500 })
  }
}
