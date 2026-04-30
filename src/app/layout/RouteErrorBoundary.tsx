import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '../components/ui/button';

/**
 * react-router 의 errorElement.
 * 라우트 매칭 실패(404) / 로더 throw / Component 렌더 throw 모두 여기로 떨어짐.
 *
 * 기본 react-router 에러 화면은 'Hey developer 👋' 디버그 화면이라
 * 사용자에게 보일 화면으로 교체.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">
        {is404 ? 'Page Not Found' : 'Something went wrong'}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {is404 ? '페이지를 찾을 수 없습니다' : '문제가 발생했어요'}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {is404
          ? '주소가 바뀌었거나 잘못된 링크일 수 있습니다.'
          : '잠시 후 다시 시도해 주세요. 반복되면 알려주세요.'}
      </p>

      {!is404 && error instanceof Error && (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-md border bg-card px-3 py-2 text-left text-[11px] text-muted-foreground">
          {error.message}
        </pre>
      )}

      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline">
          <Link to="/">홈으로</Link>
        </Button>
        <Button asChild>
          <Link to="/groups">내 그룹</Link>
        </Button>
      </div>
    </div>
  );
}
