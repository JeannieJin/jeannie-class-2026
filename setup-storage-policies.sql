-- Supabase Storage 정책 설정
-- Supabase 대시보드 → Storage → profiles 버킷 생성 후
-- SQL Editor에서 아래 코드 실행

-- 1. profiles 버킷에 대한 RLS 정책 설정

-- 모든 인증된 사용자가 자신의 프로필 이미지를 업로드할 수 있음
CREATE POLICY "인증된 사용자는 프로필 이미지를 업로드할 수 있음"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 모든 사용자가 프로필 이미지를 볼 수 있음
CREATE POLICY "모든 사용자가 프로필 이미지를 볼 수 있음"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- 사용자는 자신의 프로필 이미지를 업데이트할 수 있음
CREATE POLICY "사용자는 자신의 프로필 이미지를 업데이트할 수 있음"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 사용자는 자신의 프로필 이미지를 삭제할 수 있음
CREATE POLICY "사용자는 자신의 프로필 이미지를 삭제할 수 있음"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
