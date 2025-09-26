# UI & UX Review

## Submission Experience (`/`)
- Provide progressive disclosure or multi-step flow so C-level clients aren’t overwhelmed by the full form at once.
- Convert freeform fields such as *Project type*, *Investment*, and *Timeline* into select/dropdown controls with presets (with optional "Other") to reduce ambiguous responses.
- Shorten placeholder copy; move the narrative examples into the hint line so inputs feel cleaner before typing.
- Add inline validation with friendly error messages (e.g., phone format, URL validation for references) and success confirmation explaining what happens next.
- Include a sticky summary or progress bar so users remember which sections remain in long forms.

## Team Intake (`/new`)
- Consider distinguishing the `/new` layout visually (e.g., header ribbon or breadcrumb) so internal staff immediately know they’re in the workspace, not the public site.
- Add quick links in the header to revisit recent submissions or switch back to the dashboard for faster triage.

## Dashboard (`/dashboard`)
- Add filtering and search across submissions (e.g., by project type, client, status, date range).
- Format dates using a human-friendly format ("12 Jul 2025") and show relative time since submission.
- Include action buttons inside the table (e.g., "Review" or "Open Plan") to reduce navigation friction.
- Surface at-a-glance health indicators: number awaiting review this week, upcoming key moments, etc.

## Project List (`/projects`)
- Display investment posture and primary contact directly in the card to help prioritize at a glance.
- Add sorting (newest, key moment) and quick status filters to support larger pipelines.
- Consider a responsive list layout for mobile (stacked cards with key metadata up top).

## Project Detail (`/projects/[id]`)
- Group metadata into labeled sections (Client, Investment, Key Moment). Current layout repeats field names without hierarchy.
- Provide links to Supabase-stored references and any uploaded artefacts with file types/icons.
- Offer a “Next Steps” checklist (accept project, schedule discovery) to guide account managers.

## Plan Preview (`/projects/[id]/plan`)
- Since auto-planning is disabled, add a call-to-action for enabling the agent pipeline or a sample milestone list to set expectations.
- Provide a download/export option for the intake data (PDF or email) so accounts can share with stakeholders.

## Review Console (`/review`)
- Add filters (status, project type, key moment window) so reviewers can triage faster.
- Introduce pagination or lazy-loading to prevent long scrolls when volume grows.
- Provide a timeline of review actions (who accepted/rejected, when) to support auditing.
- For accepted projects, link directly to the `/projects/[id]` view.

## Task Detail (`/tasks/[id]`)
- Handle Supabase fallback gracefully—currently this page assumes Supabase connectivity; if the table is missing or credentials fail, it renders 404. Include a friendly error or fallback messaging similar to the submissions flow.
- Add run status filters (only failures, last attempt) and highlight actionable items.
- Provide a button to copy branch / PR URLs, and show elapsed time between attempts.

## Global / Visual System
- Establish consistent spacing scale across cards and sections (some cards use 24px padding, others 32px).
- Audit color contrast for text on translucent surfaces to ensure accessibility.
- Define motion tokens (durations, easing) for hover/entrance transitions for a more cohesive feel.
- Add skeleton loaders or shimmer placeholders where data is fetched async to avoid layout jumps.

