import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import type { GroupRow, TrpgSystem } from '../lib/supabase/database.types';
import { useScenario } from '../features/scenarios/api';
import { useDeleteScenario, useUpdateScenario } from '../features/scenarios/mutations';
import { useSession } from '../features/auth/useSession';

interface GroupOutletContext {
  group: GroupRow;
}

const SYSTEM_OPTIONS: { value: TrpgSystem; label: string }[] = [
  { value: 'coc7', label: 'CoC 7판' },
  { value: 'dnd5e', label: 'D&D 5e' },
  { value: 'dungeon_world', label: '던전월드' },
  { value: 'fiasco', label: 'Fiasco' },
  { value: 'insane', label: '인세인' },
  { value: 'shahonkok', label: '사혼곡' },
  { value: 'custom', label: '커스텀' },
];

const SUGGESTED_TWS = [
  '자해', '약물', '동물 학대', '아동 학대', '성폭력', '신체 훼손',
  '광기', '폐소공포', '공포증 자극', '죽음 묘사',
];

interface GMOnly {
  spoilers?: string;
  npcs?: string;
  branches?: string;
}

export function ScenarioEditPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: scenario, isLoading } = useScenario(scenarioId);
  const update = useUpdateScenario();
  const del = useDeleteScenario();

  const [system, setSystem] = useState<TrpgSystem>('coc7');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [recommendedPlayers, setRecommendedPlayers] = useState('');
  const [expectedPlayTime, setExpectedPlayTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [genreTagsRaw, setGenreTagsRaw] = useState('');
  const [triggerWarnings, setTriggerWarnings] = useState<string[]>([]);
  const [twCustom, setTwCustom] = useState('');
  const [handout, setHandout] = useState('');
  const [bgmRecommendation, setBgmRecommendation] = useState('');
  const [gmSpoilers, setGmSpoilers] = useState('');
  const [gmNpcs, setGmNpcs] = useState('');
  const [gmBranches, setGmBranches] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => {
    if (!scenario) return;
    setSystem(scenario.system);
    setTitle(scenario.title);
    setAuthor(scenario.author ?? '');
    setDescription(scenario.description ?? '');
    setRecommendedPlayers(scenario.recommended_players ?? '');
    setExpectedPlayTime(scenario.expected_play_time ?? '');
    setDifficulty(scenario.difficulty ?? '');
    setGenreTagsRaw((scenario.genre_tags ?? []).join(', '));
    setTriggerWarnings(scenario.trigger_warnings ?? []);
    setHandout(scenario.handout ?? '');
    setBgmRecommendation(scenario.bgm_recommendation ?? '');
    const gm = (scenario.gm_only ?? {}) as GMOnly;
    setGmSpoilers(gm.spoilers ?? '');
    setGmNpcs(gm.npcs ?? '');
    setGmBranches(gm.branches ?? '');
  }, [scenario]);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted-foreground">불러오는 중…</div>;
  }
  if (!scenario) return <Navigate to=".." replace relative="path" />;
  if (user && scenario.owner_id !== user.id) {
    return <Navigate to={`/g/${group.slug}/scenarios/${scenario.id}`} replace />;
  }

  const toggleTw = (t: string) => {
    setTriggerWarnings((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };
  const addCustomTw = () => {
    const v = twCustom.trim();
    if (!v) return;
    if (!triggerWarnings.includes(v)) setTriggerWarnings((p) => [...p, v]);
    setTwCustom('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('제목을 입력하세요');
      return;
    }
    setSubmitting(true);
    try {
      const genreTags = genreTagsRaw
        .split(/[,#]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const gmOnly: Record<string, string> = {};
      if (gmSpoilers.trim()) gmOnly.spoilers = gmSpoilers.trim();
      if (gmNpcs.trim()) gmOnly.npcs = gmNpcs.trim();
      if (gmBranches.trim()) gmOnly.branches = gmBranches.trim();

      await update.mutateAsync({
        id: scenario.id,
        patch: {
          system,
          title: title.trim(),
          author: author.trim() || null,
          description: description.trim() || null,
          recommended_players: recommendedPlayers.trim() || null,
          expected_play_time: expectedPlayTime.trim() || null,
          difficulty: difficulty.trim() || null,
          genre_tags: genreTags,
          trigger_warnings: triggerWarnings,
          handout: handout.trim() || null,
          bgm_recommendation: bgmRecommendation.trim() || null,
          gm_only: gmOnly as never,
        },
      });
      toast.success('저장됨');
      navigate(`/g/${group.slug}/scenarios/${scenario.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[update-scenario] failed:', err);
      const msg = (err as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`저장 실패: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (confirmText.trim() !== scenario.title.trim()) return;
    try {
      await del.mutateAsync(scenario.id);
      toast.success(`"${scenario.title}" 삭제됨`);
      setDelOpen(false);
      navigate(`/g/${group.slug}/scenarios`, { replace: true });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`삭제 실패: ${msg}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{group.is_solo ? '내 작업실' : group.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{scenario.title} 편집</h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">기본 정보</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>시스템</Label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as TrpgSystem)}
                className="h-9 w-full rounded-md border bg-input-background px-3 text-sm outline-none focus:border-ring"
              >
                {SYSTEM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="author">작가</Label>
              <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec">추천 인원</Label>
              <Input id="rec" value={recommendedPlayers} onChange={(e) => setRecommendedPlayers(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">예상 플레이타임</Label>
              <Input id="time" value={expectedPlayTime} onChange={(e) => setExpectedPlayTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diff">난이도</Label>
              <Input id="diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">시나리오 소개</Label>
            <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="genre">장르 태그</Label>
            <Input
              id="genre"
              value={genreTagsRaw}
              onChange={(e) => setGenreTagsRaw(e.target.value)}
              placeholder="콤마 또는 # 로 구분"
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">트리거 워닝</h2>
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_TWS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTw(t)}
                className={[
                  'rounded-full border px-2.5 py-1 text-xs transition',
                  triggerWarnings.includes(t)
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'bg-background text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {triggerWarnings.includes(t) ? '⚠ ' : '+ '}
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={twCustom}
              onChange={(e) => setTwCustom(e.target.value)}
              placeholder="직접 추가"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTw();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addCustomTw}>
              추가
            </Button>
          </div>
          {triggerWarnings.length > 0 && (
            <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
              선택됨:
              {triggerWarnings.map((t) => (
                <span key={t} className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                  ⚠ {t}{' '}
                  <button type="button" onClick={() => toggleTw(t)} className="ml-0.5 hover:underline">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">자료</h2>
          <div className="space-y-1.5">
            <Label htmlFor="handout">핸드아웃</Label>
            <Textarea id="handout" rows={3} value={handout} onChange={(e) => setHandout(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bgm">추천 BGM</Label>
            <Textarea id="bgm" rows={2} value={bgmRecommendation} onChange={(e) => setBgmRecommendation(e.target.value)} />
          </div>
        </section>

        <section className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-5 space-y-4 dark:bg-amber-950/10">
          <h2 className="text-sm font-medium text-amber-700 dark:text-amber-400">
            GM 전용 (스포일러)
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="gm-spoil">스포일러 / 진실</Label>
            <Textarea id="gm-spoil" rows={4} value={gmSpoilers} onChange={(e) => setGmSpoilers(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gm-npc">NPC 스탯</Label>
            <Textarea id="gm-npc" rows={4} value={gmNpcs} onChange={(e) => setGmNpcs(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gm-branch">분기 / 노트</Label>
            <Textarea id="gm-branch" rows={3} value={gmBranches} onChange={(e) => setGmBranches(e.target.value)} />
          </div>
        </section>

        <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-sm font-medium text-destructive">위험 영역</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            시나리오를 삭제합니다. 같은 시나리오로 진행했던 세션 기록과의 연결도 끊어집니다.
          </p>
          <div className="mt-3">
            <AlertDialog
              open={delOpen}
              onOpenChange={(v) => {
                setDelOpen(v);
                if (!v) setConfirmText('');
              }}
            >
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 className="mr-1 h-4 w-4" />
                  시나리오 삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-medium text-foreground">{scenario.title}</span> 의 모든
                    데이터가 영구 삭제됩니다. 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    확인을 위해 제목{' '}
                    <span className="rounded bg-muted px-1 font-medium text-foreground">
                      {scenario.title}
                    </span>{' '}
                    을 정확히 입력하세요.
                  </label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={scenario.title}
                    autoFocus
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={confirmText.trim() !== scenario.title.trim() || del.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {del.isPending ? '삭제 중…' : '삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/g/${group.slug}/scenarios/${scenario.id}`)}
          >
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  );
}
