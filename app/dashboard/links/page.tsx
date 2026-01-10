import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LinkFormDialog } from '@/components/link-form-dialog'
import { LinkDeleteButton } from '@/components/link-delete-button'
import { ExternalLink, Link2 } from 'lucide-react'

export default async function LinksPage() {
  const user: any = await getCurrentUser()
  const supabase = await createClient()

  // 참고 링크 목록 가져오기
  const { data: links } = (await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })) as any

  // 카테고리별로 그룹화
  const linksByCategory = links?.reduce(
    (acc: any, link: any) => {
      const category = link.category || '기타'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(link)
      return acc
    },
    {} as Record<string, typeof links>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">참고링크</h1>
          <p className="text-muted-foreground">
            학습에 도움이 되는 유용한 링크를 확인하세요
          </p>
        </div>
        {user?.role === 'teacher' && (
          <LinkFormDialog />
        )}
      </div>

      {linksByCategory && Object.keys(linksByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(linksByCategory).map(([category, categoryLinks]: [string, any]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {category}
                </Badge>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryLinks?.map((item: any) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow group">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base flex-1">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:underline hover:text-primary"
                          >
                            <Link2 className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">{item.title}</span>
                          </a>
                        </CardTitle>
                        {user?.role === 'teacher' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <LinkFormDialog
                              mode="edit"
                              link={item}
                            />
                            <LinkDeleteButton
                              linkId={item.id}
                              linkTitle={item.title}
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {item.description}
                        </p>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{item.url}</span>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="text-center space-y-2">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-lg text-muted-foreground">
                등록된 참고 링크가 없습니다
              </p>
              {user?.role === 'teacher' && (
                <p className="text-sm text-muted-foreground">
                  추가하기 버튼을 눌러 새 링크를 등록하세요
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
