import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { getCurrentUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = (await getCurrentUser()) as any

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userName={user?.name} avatarUrl={user?.avatar_url} />
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl py-8 px-8">{children}</div>
      </main>
    </div>
  )
}
