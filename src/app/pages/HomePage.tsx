import { Link } from 'react-router';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useSession } from '../features/auth/useSession';

const features = [
  {
    title: '캐릭터 시트',
    desc: '자동계산 + 코코포리아 채팅팔레트 export',
    badge: 'CoC 7판 우선',
  },
  {
    title: '시나리오 / SessionRun',
    desc: '같은 시나리오를 여러 번 굴려도 각각 독립 기록',
    badge: '핵심 모델',
  },
  {
    title: '세션 로그',
    desc: '코코포리아·디스코드 로그 붙여넣기 → 자동 정리',
    badge: '아카이브',
  },
  {
    title: '관계 맵',
    desc: '그룹 단위 캐릭터 관계, 시점 토글',
    badge: 'React Flow',
  },
  {
    title: '구인구직 / 일정',
    desc: 'when2meet 스타일 슬롯 + 반복 일정',
    badge: '매칭',
  },
] as const;

export function HomePage() {
  const { user, isLoading } = useSession();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-sm text-muted-foreground">Uncover Your Tales</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          우리 그룹의 TRPG 아카이브
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          가려져 있던 캠페인과 캐릭터 이야기를 드러냅니다.
        </p>

        {!isLoading && (
          <div className="mt-6">
            {user ? (
              <Button asChild size="lg">
                <Link to="/groups">내 그룹으로 →</Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to="/auth/login">로그인하고 시작하기 →</Link>
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {f.badge}
                </span>
              </div>
              <CardDescription className="mt-2">{f.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
