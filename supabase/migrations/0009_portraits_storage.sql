-- =====================================================================
-- 0009: 캐릭터 일러스트 / 초상화 — Supabase Storage
--
-- 버킷 'portraits' 를 만들고, 사용자가 자기 폴더에만 업로드할 수 있게 한다.
-- 공개 버킷이라 URL 자체는 누구나 볼 수 있지만, 그건 의도된 동작 (이미지 src 로 사용).
-- DB 의 characters.portrait_url 이 권위.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portraits',
  'portraits',
  true,
  5 * 1024 * 1024,                                          -- 5MB 상한
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS 정책 — 인증된 사용자가 자기 폴더에만 업로드.
-- 경로 컨벤션: {auth.uid()}/{character_id}-{timestamp}.{ext}
-- 즉 storage.foldername(name)[1] = auth.uid()::text 이어야 함.

drop policy if exists "portraits_select" on storage.objects;
drop policy if exists "portraits_insert_own" on storage.objects;
drop policy if exists "portraits_update_own" on storage.objects;
drop policy if exists "portraits_delete_own" on storage.objects;

create policy "portraits_select"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'portraits');

create policy "portraits_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portraits'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portraits_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portraits'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'portraits'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portraits_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portraits'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
