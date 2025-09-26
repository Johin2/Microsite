import { NextResponse } from 'next/server'

import { findSubmission, updateSubmissionStatus } from '@/lib/submission-store'

const allowedStatuses = new Set(['pending', 'accepted', 'rejected'])

export async function GET(_, { params }) {
  const submission = await findSubmission(params.id)
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }

  return NextResponse.json({ submission })
}

export async function PATCH(request, { params }) {
  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { status } = payload

  if (typeof status !== 'string' || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: 'Status must be one of pending, accepted, or rejected.' }, { status: 400 })
  }

  try {
    const updated = await updateSubmissionStatus(params.id, status)

    if (!updated) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
    }

    return NextResponse.json({ submission: updated })
  } catch (error) {
    console.error('Failed to update submission status', error)
    return NextResponse.json({ error: 'Unable to update submission.' }, { status: 500 })
  }
}
