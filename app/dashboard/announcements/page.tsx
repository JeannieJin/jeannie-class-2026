import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnnouncementFormDialog } from '@/components/announcement-form-dialog'
import { AnnouncementDeleteButton } from '@/components/announcement-delete-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function AnnouncementsPage() {
  const user: any = await getCurrentUser()
  const supabase = await createClient()

  // 전달사항 가져오기 (고정된 것 우선, 최신순)
  const { data: announcements } = (await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false }))

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Bell className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">전달사항</h1>
              <p className="text-lg text-muted-foreground">
                학급 전달사항 및 알림
              </p>
            </div>
          </div>
          {user?.role === 'teacher' && (
            <AnnouncementFormDialog />
          )}
        </div>
      </div>

      {/* 전달사항 목록 테이블 */}
      <Card>
        <CardContent className="p-0">
          {announcements && announcements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">번호</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>내용</TableHead>
                  {user?.role === 'teacher' && (
                    <TableHead className="w-24 text-center">작업</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement: any, index: number) => {
                  return (
                    <TableRow key={announcement.id} className="hover:bg-muted/50">
                      {/* 번호 */}
                      <TableCell className="font-medium text-muted-foreground">
                        {announcements.length - index}
                      </TableCell>

                      {/* 제목 */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{announcement.title}</div>
                            {announcement.is_pinned && (
                              <Badge variant="secondary" className="shrink-0">
                                고정
                              </Badge>
                            )}
                            {announcement.priority === 'high' && (
                              <Badge variant="destructive" className="shrink-0">
                                중요
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(announcement.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                          </div>
                        </div>
                      </TableCell>

                      {/* 내용 */}
                      <TableCell>
                        <div className="text-sm whitespace-pre-wrap">
                          {announcement.content}
                        </div>
                      </TableCell>

                      {/* 작업 버튼 (교사만) */}
                      {user?.role === 'teacher' && (
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <AnnouncementFormDialog
                              mode="edit"
                              announcement={announcement}
                            />
                            <AnnouncementDeleteButton
                              announcementId={announcement.id}
                              announcementTitle={announcement.title}
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <div className="text-center space-y-2">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-lg text-muted-foreground">
                  등록된 전달사항이 없습니다
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
