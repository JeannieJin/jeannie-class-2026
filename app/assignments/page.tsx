import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calculator, Globe, Atom, Languages, FolderOpen } from 'lucide-react'

const subjects = [
  {
    id: 'korean',
    name: '국어',
    icon: BookOpen,
    color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    iconColor: 'text-blue-500'
  },
  {
    id: 'math',
    name: '수학',
    icon: Calculator,
    color: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
    iconColor: 'text-purple-500'
  },
  {
    id: 'social',
    name: '사회',
    icon: Globe,
    color: 'from-green-500/10 to-green-500/5 border-green-500/20',
    iconColor: 'text-green-500'
  },
  {
    id: 'science',
    name: '과학',
    icon: Atom,
    color: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
    iconColor: 'text-orange-500'
  },
  {
    id: 'english',
    name: '영어',
    icon: Languages,
    color: 'from-pink-500/10 to-pink-500/5 border-pink-500/20',
    iconColor: 'text-pink-500'
  },
  {
    id: 'other',
    name: '그외',
    icon: FolderOpen,
    color: 'from-gray-500/10 to-gray-500/5 border-gray-500/20',
    iconColor: 'text-gray-500'
  }
]

export default function AssignmentsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">과제</h1>
        <p className="text-lg text-muted-foreground">
          과목별 과제를 확인하고 제출하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const Icon = subject.icon
          return (
            <Link key={subject.id} href={`/assignments/${subject.id}`}>
              <Card className={`bg-gradient-to-br ${subject.color} hover:shadow-lg transition-all cursor-pointer`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-background/50`}>
                      <Icon className={`h-6 w-6 ${subject.iconColor}`} />
                    </div>
                    <span className="text-2xl">{subject.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {subject.name} 과제 목록 보기
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
