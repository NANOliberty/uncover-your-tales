import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { peekInvite, useRedeemInvite } from '../features/groups/mutations';
import { useMyGroups } from '../features/groups/api';

interface InvitePreview {
  group_id: string;
  group_name: string;
  group_slug: string;
  default_role: string;
  expires_at: string | null;
  remaining_uses: number;
}

/**
 * 초대 코드 입력 → 미리보기 → 가입.
 *
 * 두 단계로 나눈 이유:
 *  1) 사용자가 어느 그룹의 초대인지 확인하고 들어가야 안전감.
 *  2) 코드 자체를 노출 없이 RPC 만으로 검증 가능.
 *
 * URL ?code= 로 들어오면 자동 미리보기.
 */
export function JoinGroupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState((searchParams.get('code') ?? '').toUpperCase());
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const redeem = useRedeemInvite();
  const { data: myGroups = [] } = useMyGroups();

  const tryPreview = async (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (c.length < 6) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    setPreviewing(true);
    setPreviewError(null);
    try {
      const data = await peekInvite(c);
      if (!data) {
        setPreview(null);
        setPreviewError('유효하지 않거나 만료된 코드입니다');
      } else {
        setPreview(data);
      }
    } catch (e) {
      setPreview(null);
      setPreviewError(e instanceof Error ? e.message : '코드 확인 실패');
    } finally {
      setPreviewing(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get('code');
    if (initial) tryPreview(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onJoin = async () => {
    if (!preview) return;
    try {
      const groupId = await redeem.mutateAsync(code);
      // 응답은 group_id 지만 navigate 는 slug 가 더 읽기 좋다.
      const target = preview.group_slug ?? groupId;
      toast.success(`"${preview.group_name}" 에 합류했어요`);
      navigate(`/g/${target}`);
    } catch (e) {
      const msg = friendlyMessage(e);
      toast.error(msg);
      setPreviewError(msg);
    }
  };

  const alreadyMember = preview && myGroups.some((g) => g.id === preview.group_id);

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">그룹 참여</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">초대 코드 입력</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          친구가 보낸 6~12자리 코드를 입력하세요.
        </p>
      </header>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="code">초대 코드</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => {
              const v = e.target.value.toUpperCase();
              setCode(v);
              setPreview(null);
              setPreviewError(null);
            }}
            onBlur={() => tryPreview(code)}
            placeholder="ABCDEF"
            className="font-mono tracking-widest"
            maxLength={12}
          />
          {previewing && <p className="text-xs text-muted-foreground">확인 중…</p>}
          {previewError && <p className="text-xs text-destructive">{previewError}</p>}
        </div>

        {preview && (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">참여할 그룹</p>
            <p className="mt-1 text-base font-medium">{preview.group_name}</p>
            <p className="text-xs text-muted-foreground">/g/{preview.group_slug}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5">
                역할 {preview.default_role}
              </span>
              {preview.expires_at && (
                <span className="rounded-full bg-muted px-2 py-0.5">
                  만료 {new Date(preview.expires_at).toLocaleString()}
                </span>
              )}
              <span className="rounded-full bg-muted px-2 py-0.5">
                남은 사용 {preview.remaining_uses}
              </span>
            </div>
            {alreadyMember && (
              <p className="mt-3 text-xs text-muted-foreground">
                이미 멤버입니다. 그룹 페이지로 바로 이동합니다.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate('/groups')}>
            취소
          </Button>
          {!preview ? (
            <Button onClick={() => tryPreview(code)} disabled={code.length < 6 || previewing}>
              확인
            </Button>
          ) : alreadyMember ? (
            <Button onClick={() => navigate(`/g/${preview.group_slug}`)}>그룹으로 이동</Button>
          ) : (
            <Button onClick={onJoin} disabled={redeem.isPending}>
              {redeem.isPending ? '가입 중…' : '가입하기'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('AUTH_REQUIRED')) return '로그인이 필요합니다';
  if (msg.includes('INVITE_NOT_FOUND')) return '코드를 찾을 수 없습니다';
  if (msg.includes('INVITE_REVOKED')) return '이미 회수된 초대입니다';
  if (msg.includes('INVITE_EXPIRED')) return '만료된 초대입니다';
  if (msg.includes('INVITE_EXHAUSTED')) return '사용 횟수가 다 찼습니다';
  return msg;
}
