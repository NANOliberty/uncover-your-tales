import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase/client';

interface Props {
  /** 현재 표시할 URL (없으면 placeholder) */
  value: string | null;
  /** 이 캐릭터 ID — 파일 경로에 포함해 다른 캐릭터와 구분 */
  characterId: string;
  /** 업로드한 user.id — 정책상 폴더 prefix */
  userId: string;
  /** 변경 후 부모에게 새 URL(또는 null) 전달 */
  onChange: (url: string | null) => void;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * 일러스트 업로더.
 * - 클릭 → 파일 선택 → Supabase Storage 'portraits' 버킷의 자기 폴더에 업로드
 * - 업로드 성공 시 public URL 을 부모에 알려 characters.portrait_url 갱신
 * - 기존 이미지 교체 시 옛 파일 삭제 (같은 경로 prefix 검증)
 */
export function PortraitUploader({ value, characterId, userId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const upload = async (file: File) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('JPG, PNG, WEBP, GIF 만 업로드 가능합니다');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('5MB 이하만 업로드 가능합니다');
      return;
    }

    setBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${userId}/${characterId}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('portraits')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('portraits').getPublicUrl(path);
      onChange(data.publicUrl);

      // 옛 이미지가 같은 prefix 폴더 안이면 삭제 시도 (실패해도 무시).
      if (value) {
        const oldPath = extractPathFromPublicUrl(value);
        if (oldPath && oldPath.startsWith(`${userId}/`) && oldPath !== path) {
          await supabase.storage.from('portraits').remove([oldPath]).catch(() => {});
        }
      }

      toast.success('업로드 완료');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[portrait-upload] failed:', e);
      const msg = (e as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`업로드 실패: ${msg}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!value) return;
    setBusy(true);
    try {
      const path = extractPathFromPublicUrl(value);
      if (path && path.startsWith(`${userId}/`)) {
        await supabase.storage.from('portraits').remove([path]).catch(() => {});
      }
      onChange(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted transition hover:border-primary/40"
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <User className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </div>
      </button>

      <div className="flex flex-col gap-1">
        <Button type="button" size="sm" variant="outline" onClick={pick} disabled={busy}>
          {value ? '교체' : '업로드'}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={busy}>
            <Trash2 className="mr-1 h-3 w-3" />
            제거
          </Button>
        )}
        <p className="text-[10px] text-muted-foreground">JPG·PNG·WEBP·GIF / 5MB 이하</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
    </div>
  );
}

/** Supabase public URL 에서 파일 path 추출. 형태: .../storage/v1/object/public/portraits/{path} */
function extractPathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/portraits/';
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.slice(idx + marker.length);
}
