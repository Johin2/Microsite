import { requireTeamUser } from '@lib/auth'

export default async function ReviewLayout({ children }) {
  await requireTeamUser()
  return <>{children}</>
}

