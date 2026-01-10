import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  // 전달사항 가져오기 (고정된 것 우선, 최신순)
  const { data: announcements } = (await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })) as any

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">전달사항</h1>
        <p className="text-muted-foreground">
          학급 공지사항과 알림을 확인하세요
        </p>
      </div>

      <div className="space-y-4">
        {announcements && announcements.length > 0 ? (
          announcements.map((item: any) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{item.title}</CardTitle>
                      {item.is_pinned && (
                        <Badge variant="secondary">고정</Badge>
                      )}
                      {item.priority === 'high' && (
                        <Badge variant="destructive">중요</Badge>
                      )}
                      {item.priority === 'medium' && (
                        <Badge variant="default">보통</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), 'PPP p', { locale: ko })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{item.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">전달사항이 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
