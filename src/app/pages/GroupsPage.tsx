import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useSession } from '../features/auth/useSession';
import { useMyGroups } from '../features/groups/api';

/**
 * 인증 사용자의 허브.
 * - 내 그룹 목록 (RLS 가 알아서 거름)
 * - 빈 상태에서 그룹 만들기 / 초대 코드 입력 (M1.4 에서 활성화)
 */
export function GroupsPage() {
  const { user } = useSession();
  const { data: groups = [], isLoading } = useMyGroups();

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
          모든 콘텐츠는 그룹 단위로 보관됩니다.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          그룹 목록 불러오는 중…
        </div>
      ) : groups.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                to={`/g/${g.slug}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent"
              >
                {g.logo_url ? (
                  <img
                    src={g.logo_url}
                    alt=""
                    className="h-9 w-9 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted text-sm font-medium text-muted-foreground">
                    {g.name.charAt(0)}
                  </div>
                )}
                <div className="flex flex-1 flex-col leading-tight">
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="text-xs text-muted-foreground">
                    /g/{g.slug}
                    {g.description ? ` · ${g.description}` : ''}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>그룹 만들기</CardTitle>
            <CardDescription>친구들을 초대해 새 그룹을 시작합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/groups/new">새 그룹 만들기</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>초대 코드로 참여</CardTitle>
            <CardDescription>받은 6~12자리 코드를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/groups/join">코드 입력</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <p className="text-sm font-medium">아직 소속된 그룹이 없습니다.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        친구가 보낸 초대 코드가 있다면 입력하고, 없다면 새로 만들어 보세요.
      </p>
    </div>
  );
}
