import { useNavigate, useParams } from 'react-router';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useMyGroups } from '../features/groups/api';
import { useSession } from '../features/auth/useSession';

/**
 * 헤더의 그룹 스위처. 인증된 사용자에게만 노출.
 * - 현재 URL 의 :slug 와 매칭되는 그룹을 활성으로 표시
 * - 드롭다운에서 다른 그룹을 고르면 같은 sub-route 로 이동 (가능하면)
 */
export function GroupSwitcher() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { slug: activeSlug } = useParams<{ slug: string }>();
  const { data: groups = [], isLoading } = useMyGroups();

  if (!user) return null;

  const active = groups.find((g) => g.slug === activeSlug);

  const switchTo = (slug: string) => {
    // 현재 그룹 컨텍스트 안이면 같은 sub-route 유지, 아니면 그룹 루트로.
    const path = window.location.pathname;
    const sub = activeSlug && path.startsWith(`/g/${activeSlug}/`)
      ? path.slice(`/g/${activeSlug}`.length)
      : '';
    navigate(`/g/${slug}${sub}`);
  };

  const trigger = (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent"
    >
      <span className="text-muted-foreground">그룹</span>
      <span className="font-medium">
        {active ? active.name : groups.length === 0 ? '없음' : '선택'}
      </span>
      <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          내 그룹 {isLoading && '…'}
        </DropdownMenuLabel>
        {groups.length === 0 && !isLoading && (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            아직 소속된 그룹이 없습니다.
          </div>
        )}
        {groups.map((g) => (
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
        <DropdownMenuItem onSelect={() => navigate('/groups')}>
          <Plus className="mr-2 h-4 w-4" />
          그룹 만들기 / 참여 (M1.4)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
