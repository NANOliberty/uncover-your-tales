import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useSession } from '../features/auth/useSession';
import { useGroupSplit } from '../features/groups/api';

/**
 * 인증 사용자의 허브.
 * - 내 작업실 (solo) — 항상 위에 hero 카드로
 * - 공유 그룹 — 리스트 (없으면 빈 상태)
 * - 그룹 만들기 / 초대 코드 진입점
 */
export function GroupsPage() {
  const { user } = useSession();
  const { personal, shared, isLoading } = useGroupSplit();

  const greetingName =
    (user?.user_metadata as Record<string, string | undefined> | undefined)?.full_name ??
    user?.email ??
    '플레이어';

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">내 그룹</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {greetingName}님, 어디로 가시겠어요?
        </h1>
        <p className="mt-2 text-muted-foreground">
          개인 작업실은 솔로 작업·단발 준비용. 공유 그룹은 정기 캠페인용.
        </p>
      </header>

      {/* 내 작업실 — 항상 hero */}
      {personal && (
        <Link
          to={`/g/${personal.slug}`}
          className="mb-6 block overflow-hidden rounded-xl border bg-card transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-1 flex-col leading-tight">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                개인 작업실
              </span>
              <span className="mt-0.5 text-base font-medium">{personal.name}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                솔로 캐릭터 · 시나리오 초안 · 단발 준비
              </span>
            </div>
            <span className="text-sm text-muted-foreground">→</span>
          </div>
        </Link>
      )}

      {/* 공유 그룹 */}
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">함께하는 그룹</h2>
        {isLoading ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            그룹 목록 불러오는 중…
          </div>
        ) : shared.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              아직 함께하는 그룹이 없습니다. 정기 캠페인이 생기면 그룹으로 묶어 보세요.
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {shared.map((g) => (
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
      </div>

      {/* CTA */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>새 공유 그룹</CardTitle>
            <CardDescription>친구들과 정기 캠페인용 공간 만들기.</CardDescription>
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
