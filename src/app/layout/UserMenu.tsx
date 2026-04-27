import { useNavigate } from 'react-router';
import { signOut, useSession } from '../features/auth/useSession';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export function UserMenu() {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!user) {
    return (
      <Button size="sm" variant="default" onClick={() => navigate('/auth/login')}>
        로그인
      </Button>
    );
  }

  // user_metadata 는 provider 마다 모양이 달라 fallback 체인을 둔다.
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = meta.full_name ?? meta.name ?? meta.user_name ?? user.email ?? 'PL';
  const avatarUrl = meta.avatar_url ?? meta.picture;
  const initial = name.trim().charAt(0).toUpperCase() || 'U';

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="사용자 메뉴"
        >
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{name}</span>
            {user.email && (
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/groups')}>내 그룹</DropdownMenuItem>
        <DropdownMenuItem disabled>프로필 (M9)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="text-destructive">
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
