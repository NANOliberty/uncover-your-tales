import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useSession } from '../features/auth/useSession';

/**
 * 인증 사용자의 허브.
 * - 소속 그룹 목록 (M1.3 에서 실 데이터)
 * - 그룹 만들기 / 초대 코드 입력 진입점 (M1.4)
 *
 * 지금은 placeholder 카드 두 개만.
 */
export function GroupsPage() {
  const { user } = useSession();
  const greetingName =
    (user?.user_metadata as Record<string, string | undefined> | undefined)?.full_name ??
    user?.email ??
    '플레이어';

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">내 그룹</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {greetingName}님, 어느 테이블로 가시겠어요?
        </h1>
        <p className="mt-2 text-muted-foreground">
          모든 콘텐츠는 그룹 단위로 보관됩니다. 친구가 보낸 초대 코드가 있다면 입력하고,
          없다면 새로 만드세요.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>그룹 만들기</CardTitle>
            <CardDescription>친구들을 초대해 새 그룹을 시작합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>준비 중 — M1.4</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>초대 코드로 참여</CardTitle>
            <CardDescription>받은 6자리 코드를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              준비 중 — M1.4
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-lg border bg-card p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">진행 상태</p>
        <ul className="mt-2 space-y-1">
          <li>• M1.1 ✓ — 스키마 (profiles / groups / group_members + RLS)</li>
          <li>• M1.2 ✓ — Discord / Google OAuth + 인증 가드</li>
          <li>• M1.3 — `/g/:slug` 실 데이터 + 그룹 스위처 (다음)</li>
          <li>• M1.4 — 그룹 생성 + 초대 코드/링크</li>
        </ul>
      </div>
    </div>
  );
}
