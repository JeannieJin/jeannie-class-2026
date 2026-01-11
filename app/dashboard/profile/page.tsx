'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const supabase: any = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = (await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single())

      if (profile) {
        setUser(profile)
        setAvatarUrl(profile.avatar_url)
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('이미지를 선택해주세요')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Public URL 가져오기
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl

      // DB에 URL 저장
      const { error: updateError } = (await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id))

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      toast.success('프로필 사진이 업데이트되었습니다')
    } catch (error: any) {
      console.error('업로드 실패:', error)
      toast.error('프로필 사진 업로드에 실패했습니다: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">프로필 설정</h1>
        <p className="text-muted-foreground">프로필 정보를 관리하세요</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>프로필 사진</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center gap-2">
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer"
                >
                  <Button
                    variant="outline"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? '업로드 중...' : '사진 업로드'}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG 파일 (최대 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input value={user.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>역할</Label>
              <Input value={user.role === 'teacher' ? '교사' : '학생'} disabled />
            </div>
            {user.student_number && (
              <div className="space-y-2">
                <Label>학번</Label>
                <Input value={user.student_number} disabled />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
