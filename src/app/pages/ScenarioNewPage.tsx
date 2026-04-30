import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import type { GroupRow, TrpgSystem } from '../lib/supabase/database.types';
import { useCreateScenario } from '../features/scenarios/mutations';

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

export function ScenarioNewPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const navigate = useNavigate();
  const create = useCreateScenario();

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

      const created = await create.mutateAsync({
        groupId: group.id,
        system,
        title: title.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        recommendedPlayers: recommendedPlayers.trim() || null,
        expectedPlayTime: expectedPlayTime.trim() || null,
        difficulty: difficulty.trim() || null,
        genreTags,
        triggerWarnings,
        handout: handout.trim() || null,
        bgmRecommendation: bgmRecommendation.trim() || null,
        gmOnly,
      });
      toast.success(`"${created.title}" 등록됨`);
      navigate(`/g/${group.slug}/scenarios/${created.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[create-scenario] failed:', err);
      const msg = (err as { message?: string })?.message ?? '알 수 없는 오류';
      toast.error(`등록 실패: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{group.is_solo ? '내 작업실' : group.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">새 시나리오</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          시나리오 자체의 정보를 등록합니다. 실제 굴린 기록은 '세션' 으로 별도 저장됩니다.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* 기본 정보 */}
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">기본 정보</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>시스템 *</Label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as TrpgSystem)}
                className="h-9 w-full rounded-md border bg-input-background px-3 text-sm outline-none focus:border-ring"
              >
                {SYSTEM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="author">작가</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="외부 작가 이름"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec">추천 인원</Label>
              <Input
                id="rec"
                value={recommendedPlayers}
                onChange={(e) => setRecommendedPlayers(e.target.value)}
                placeholder="3-5명"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">예상 플레이타임</Label>
              <Input
                id="time"
                value={expectedPlayTime}
                onChange={(e) => setExpectedPlayTime(e.target.value)}
                placeholder="3-4시간"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diff">난이도</Label>
              <Input
                id="diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                placeholder="입문 / 중급 / 고난도"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">시나리오 소개 (공개 영역)</Label>
            <Textarea
              id="desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="플레이어에게 보여줘도 되는 줄거리·분위기·세계관 (스포일러 X)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="genre">장르 태그</Label>
            <Input
              id="genre"
              value={genreTagsRaw}
              onChange={(e) => setGenreTagsRaw(e.target.value)}
              placeholder="호러, 미스터리, 단발 — 콤마 또는 # 로 구분"
            />
          </div>
        </section>

        {/* 트리거 워닝 */}
        <section className="rounded-lg border bg-card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">트리거 워닝</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              친구 사이라도 사람마다 민감한 부분이 다릅니다. 시나리오에 포함된 자극 요소를 표시.
            </p>
          </div>
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
                <span
                  key={`sel-${t}`}
                  className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive"
                >
                  ⚠ {t}{' '}
                  <button
                    type="button"
                    onClick={() => toggleTw(t)}
                    className="ml-0.5 hover:underline"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 자료 */}
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">자료</h2>
          <div className="space-y-1.5">
            <Label htmlFor="handout">핸드아웃</Label>
            <Textarea
              id="handout"
              rows={3}
              value={handout}
              onChange={(e) => setHandout(e.target.value)}
              placeholder="핸드아웃 자료 위치 / 링크 / 자유 메모"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bgm">추천 BGM</Label>
            <Textarea
              id="bgm"
              rows={2}
              value={bgmRecommendation}
              onChange={(e) => setBgmRecommendation(e.target.value)}
              placeholder="유튜브 링크, 플레이리스트 이름 등"
            />
          </div>
        </section>

        {/* GM 전용 */}
        <section className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-5 space-y-4 dark:bg-amber-950/10">
          <div>
            <h2 className="text-sm font-medium text-amber-700 dark:text-amber-400">
              GM 전용 (스포일러 영역)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              등록자(KP)에게만 보입니다. 시나리오 진행에 필요한 NPC 스탯·분기·진실 등.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gm-spoil">스포일러 / 진실</Label>
            <Textarea
              id="gm-spoil"
              rows={4}
              value={gmSpoilers}
              onChange={(e) => setGmSpoilers(e.target.value)}
              placeholder="시나리오의 핵심 비밀, 결말, 트위스트"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gm-npc">NPC 스탯</Label>
            <Textarea
              id="gm-npc"
              rows={4}
              value={gmNpcs}
              onChange={(e) => setGmNpcs(e.target.value)}
              placeholder="NPC 능력치, 무기, 행동 패턴"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gm-branch">분기 / 노트</Label>
            <Textarea
              id="gm-branch"
              rows={3}
              value={gmBranches}
              onChange={(e) => setGmBranches(e.target.value)}
              placeholder="진행 분기, KP 가 알아야 할 룰 변경, 진행 팁"
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '등록 중…' : '시나리오 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}
