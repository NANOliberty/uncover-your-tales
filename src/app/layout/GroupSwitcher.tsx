import { useNavigate, useParams } from 'react-router';
import { ChevronsUpDown, Check, Plus, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useGroupSplit } from '../features/groups/api';
import { useSession } from '../features/auth/useSession';

/**
 * 헤더의 그룹 스위처. 인증된 사용자에게만 노출.
 * - 내 작업실 (solo) 가 위, 공유 그룹은 아래
 * - 현재 URL :slug 와 매칭되는 그룹을 활성으로 표시
 * - 다른 그룹으로 이동 시 같은 sub-route 유지 (가능하면)
 */
export function GroupSwitcher() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { slug: activeSlug } = useParams<{ slug: string }>();
  const { personal, shared, isLoading } = useGroupSplit();

  if (!user) return null;

  const allGroups = personal ? [personal, ...shared] : shared;
  const active = allGroups.find((g) => g.slug === activeSlug);
  const activeLabel = active
    ? active.is_solo
      ? '내 작업실'
      : active.name
    : isLoading
      ? '…'
      : '선택';

  const switchTo = (slug: string) => {
    const path = window.location.pathname;
    const sub =
      activeSlug && path.startsWith(`/g/${activeSlug}/`)
        ? path.slice(`/g/${activeSlug}`.length)
        : '';
    navigate(`/g/${slug}${sub}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent"
        >
          <span className="text-muted-foreground">그룹</span>
          <span className="font-medium">{activeLabel}</span>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {personal && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              개인 작업실
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => switchTo(personal.slug)}>
              <div className="flex flex-1 items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                </div>
                <span className="flex-1 text-sm">내 작업실</span>
                {personal.slug === activeSlug && (
                  <Check className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs text-muted-foreground">
          함께하는 그룹 {isLoading && '…'}
        </DropdownMenuLabel>
        {shared.length === 0 && !isLoading && (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            아직 함께하는 그룹이 없습니다.
          </div>
        )}
        {shared.map((g) => (
          <DropdownMenuItem key={g.id} onSelect={() => switchTo(g.slug)}>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded border bg-muted text-[10px] font-medium text-muted-foreground">
                {g.name.charAt(0)}
              </div>
              <div className="flex flex-1 flex-col leading-tight">
                <span className="text-sm">{g.name}</span>
                <span className="text-[11px] text-muted-foreground">/g/{g.slug}</span>
              </div>
              {g.slug === activeSlug && <Check className="h-4 w-4 text-muted-foreground" />}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/groups/new')}>
          <Plus className="mr-2 h-4 w-4" />
          새 그룹 만들기
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/groups/join')}>
          초대 코드 입력
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
