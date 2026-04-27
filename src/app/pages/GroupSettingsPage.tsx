import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { toast } from 'sonner';
import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import type { GroupRow } from '../lib/supabase/database.types';
import { useSession } from '../features/auth/useSession';
import { useIssueInvite } from '../features/groups/mutations';
import { useActiveInvites } from '../features/groups/invitations-api';

interface GroupOutletContext {
  group: GroupRow;
}

/**
 * /g/:slug/settings — 관리자 운영 화면.
 * M1.4 범위: 초대 발급 + 활성 초대 목록.
 * 추후 추가: 그룹 정보 편집(이름/소개/로고), 멤버 역할 변경, 멤버 강퇴.
 */
export function GroupSettingsPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { user } = useSession();
  const issue = useIssueInvite();
  const { data: invites = [], isLoading } = useActiveInvites(group.id);

  const [maxUses, setMaxUses] = useState(1);
  const [defaultRole, setDefaultRole] = useState<'member' | 'guest'>('member');
  const [hours, setHours] = useState<number | ''>(168); // 1주일 기본

  const onIssue = async () => {
    if (!user) return;
    try {
      const expiresAt =
        hours === '' || hours === 0
          ? null
          : new Date(Date.now() + Number(hours) * 60 * 60 * 1000);
      await issue.mutateAsync({
        groupId: group.id,
        createdBy: user.id,
        maxUses,
        defaultRole,
        expiresAt,
      });
      toast.success('초대 코드가 발급되었습니다');
    } catch (e) {
      toast.error(`발급 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    }
  };

  const inviteUrl = (code: string) =>
    `${window.location.origin}/groups/join?code=${code}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} 복사됨`),
      () => toast.error('복사 실패'),
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{group.name} · 설정</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">초대 관리</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          코드는 한 번 만들면 회수하기 전까지 유효합니다. 친구마다 1회용 코드를 따로 만들어
          보내는 걸 권장합니다.
        </p>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">새 초대 발급</CardTitle>
          <CardDescription>관리자만 발급할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxUses">사용 횟수</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                max={50}
                value={maxUses}
                onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">역할</Label>
              <select
                id="role"
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value as 'member' | 'guest')}
                className="h-9 w-full rounded-md border bg-input-background px-3 text-sm"
              >
                <option value="member">일반 멤버</option>
                <option value="guest">게스트</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">만료 (시간)</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                placeholder="0 = 무제한"
                value={hours}
                onChange={(e) =>
                  setHours(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={onIssue} disabled={issue.isPending}>
              {issue.isPending ? '발급 중…' : '초대 만들기'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">활성 초대 ({invites.length})</h2>
          {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        {invites.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            아직 발급된 초대가 없습니다.
          </div>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <code className="flex-1 font-mono text-sm tracking-widest">{i.code}</code>
                <span className="text-xs text-muted-foreground">
                  {i.uses}/{i.max_uses} 사용
                  {i.expires_at && ` · ${new Date(i.expires_at).toLocaleDateString()} 만료`}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copy(i.code, '코드')}
                  title="코드 복사"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(inviteUrl(i.code), '초대 링크')}
                >
                  링크 복사
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
