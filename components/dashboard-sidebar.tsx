'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Calendar,
  Bell,
  FileText,
  CalendarDays,
  Link2,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Calculator,
  Globe,
  Atom,
  Languages,
  FolderOpen,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useState } from 'react'

const navItems = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: '시간표',
    href: '/dashboard/timetable',
    icon: Calendar,
  },
  {
    title: '전달사항',
    href: '/dashboard/announcements',
    icon: Bell,
  },
  {
    title: '과제',
    href: '/assignments',
    icon: FileText,
    children: [
      {
        title: '국어',
        href: '/assignments/korean',
        icon: BookOpen,
      },
      {
        title: '수학',
        href: '/assignments/math',
        icon: Calculator,
      },
      {
        title: '사회',
        href: '/assignments/social',
        icon: Globe,
      },
      {
        title: '과학',
        href: '/assignments/science',
        icon: Atom,
      },
      {
        title: '영어',
        href: '/assignments/english',
        icon: Languages,
      },
      {
        title: '그외',
        href: '/assignments/other',
        icon: FolderOpen,
      },
    ],
  },
  {
    title: '일정',
    href: '/dashboard/schedule',
    icon: CalendarDays,
  },
  {
    title: '참고링크',
    href: '/dashboard/links',
    icon: Link2,
  },
  {
    title: '프로필',
    href: '/dashboard/profile',
    icon: User,
  },
]

export function DashboardSidebar({
  userName = "학생",
  avatarUrl
}: {
  userName?: string
  avatarUrl?: string | null
}) {
  const pathname = usePathname()
  const today = new Date()
  const formattedDate = format(today, 'yyyy.M.d.(E)', { locale: ko })
  const [openMenus, setOpenMenus] = useState<string[]>(['과제'])

  const toggleMenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card shadow-sm">
      {/* 로고 */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">J</span>
          </div>
          <span className="text-lg font-semibold">Jeannie Class</span>
        </div>
      </div>

      {/* 프로필 영역 */}
      <div className="flex flex-col items-center py-8 px-6 border-b">
        <Avatar className="h-20 w-20 mb-3">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-base">{userName}</h3>
        <p className="text-sm text-muted-foreground">2026 학년</p>
        <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isChildActive = item.children?.some(child => pathname === child.href)
          const isOpen = openMenus.includes(item.title)

          return (
            <div key={item.href}>
              {item.children ? (
                // 하위 메뉴가 있는 경우
                <>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isChildActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isChildItemActive = pathname === child.href
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                              isChildItemActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                // 일반 메뉴 아이템
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <form action={logout as any}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </Button>
        </form>
      </div>
    </div>
  )
}
