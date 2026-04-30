import { useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router';
import { ArrowLeft, Download, Minus, Pencil, Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import type { CharacterRow, GroupRow } from '../lib/supabase/database.types';
import { useCharacter } from '../features/characters/api';
import { useUpdateCharacter } from '../features/characters/mutations';
import { KokoroforiaExportDialog } from '../features/characters/KokoroforiaExportDialog';
import { useSession } from '../features/auth/useSession';
import { COC_GRID_ORDER, COC_LABELS, fullLabel } from '../lib/coc/characteristics';
import { calculateDerived, calculateWealth, maxSanity } from '../lib/coc/derived';
import {
  COC_STANDARD_SKILLS,
  COC_SKILL_BY_KEY,
  SKILL_CATEGORY_ORDER,
  type SkillCategory,
} from '../lib/coc/skills';
import { skillTotal } from '../lib/coc/skill-calc';
import type { CoCBackstory, CoCData, CoCSkill } from '../lib/coc/types';

interface GroupOutletContext {
  group: GroupRow;
}

const STATUS_LABEL: Record<string, string> = {
  active: '활동 중',
  retired: '은퇴',
  dead: '사망',
};

const BACKSTORY_LABELS: { key: keyof CoCBackstory; label: string }[] = [
  { key: 'personalDescription', label: '겉보기' },
  { key: 'traits', label: '성격' },
  { key: 'ideologyBeliefs', label: '사상·신념' },
  { key: 'significantPeople', label: '중요한 사람들' },
  { key: 'meaningfulLocations', label: '소중한 장소' },
  { key: 'treasuredPossessions', label: '소중한 소유물' },
  { key: 'injuriesScars', label: '부상과 흉터' },
  { key: 'phobiasManias', label: '공포증과 집착증' },
  { key: 'thirdPartyEntities', label: '이상한 경험' },
  { key: 'tomesAndArtifacts', label: '신화서·주문·유물' },
  { key: 'otherNotes', label: '기타 사항' },
];

export function CharacterDetailPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { characterId } = useParams<{ characterId: string }>();
  const { data: character, isLoading, isError } = useCharacter(characterId);
  const { user } = useSession();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
        시트 불러오는 중…
      </div>
    );
  }
  if (isError || !character) return <Navigate to=".." replace relative="path" />;

  const data = (character.data ?? {}) as Partial<CoCData>;
  const isCoC = character.system === 'coc7';
  const isOwner = user?.id === character.owner_id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link to=".." relative="path">
            <ArrowLeft className="mr-1 h-4 w-4" />
            목록
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {isCoC && (
            <KokoroforiaExportDialog
              characterName={character.name}
              data={data as CoCData}
              trigger={
                <Button type="button" size="sm" variant="outline">
                  <Download className="mr-1 h-3 w-3" />
                  코코포리아 팔레트
                </Button>
              }
            />
          )}
          {isOwner && (
            <Button asChild size="sm">
              <Link to="edit">
                <Pencil className="mr-1 h-3 w-3" />
                편집
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isCoC && data.characteristics ? (
        <CoCSheet
          character={character}
          data={data as CoCData}
          isOwner={isOwner}
          inSoloGroup={group.is_solo}
        />
      ) : (
        // CoC 가 아닌 시스템 — 향후 분기. 임시 헤더만.
        <header className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-5">
          <h1 className="text-2xl font-semibold tracking-tight">{character.name}</h1>
        </header>
      )}
    </div>
  );
}

function CoCSheet({
  character,
  data,
  isOwner,
  inSoloGroup,
}: {
  character: CharacterRow;
  data: CoCData;
  isOwner: boolean;
  inSoloGroup: boolean;
}) {
  const derived = calculateDerived(data.characteristics, data.info?.age ?? null);
  const mythos = data.skills.find((s) => s.key === 'cthulhu_mythos');
  const mythosTotal = mythos ? skillTotal(mythos, data.characteristics) : 0;
  const sanCap = maxSanity(mythosTotal);

  // 인라인 트래커용 patch helper.
  const update = useUpdateCharacter();
  const patchData = async (partial: Partial<CoCData>) => {
    const next: CoCData = { ...data, ...partial };
    try {
      await update.mutateAsync({
        id: character.id,
        patch: { data: next as unknown as Record<string, unknown> },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[inline-update] failed:', e);
      toast.error('저장 실패 — 다시 시도해 주세요');
    }
  };

  const currentHp = data.currentHp ?? derived.hp;
  const currentMp = data.currentMp ?? derived.mp;
  const currentSan = data.currentSan ?? Math.min(derived.san, sanCap);

  const fullRecover = () =>
    patchData({ currentHp: null, currentMp: null, currentSan: null });

  const toggleStatus = (k: keyof NonNullable<CoCData['status']>) => () =>
    patchData({ status: { ...(data.status ?? {}), [k]: !data.status?.[k] } });

  return (
    <>
      {/* 헤더 + 특성치 — 좌: 일러스트·기본정보, 우: 3x3 특성치 그리드 */}
      <section className="mb-6 grid gap-6 rounded-lg border bg-card p-5 lg:grid-cols-2">
        <ProfileBlock character={character} data={data} inSoloGroup={inSoloGroup} />
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">특성치</h2>
          <div className="grid grid-cols-3 gap-2">
            {COC_GRID_ORDER.map((key) => {
              const v = data.characteristics[key];
              return (
                <div key={key} className="rounded-md border bg-background px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {key} · {fullLabel(key)}
                  </p>
                  <p className="mt-0.5 text-3xl font-semibold tabular-nums">{v}</p>
                  <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {v} / {Math.floor(v / 2)} / {Math.floor(v / 5)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 현재 상태 — HP/MP/SAN 인라인 편집 + 상태 토글 */}
      <section className="mb-6 rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">현재 상태</h2>
          {isOwner && (
            <Button type="button" size="sm" variant="ghost" onClick={fullRecover}>
              전체 회복
            </Button>
          )}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="grid grid-cols-3 gap-2">
            <Tracker
              label="체력"
              current={currentHp}
              max={derived.hp}
              disabled={!isOwner}
              onChange={(v) => patchData({ currentHp: v >= derived.hp ? null : v })}
            />
            <Tracker
              label="마력"
              current={currentMp}
              max={derived.mp}
              disabled={!isOwner}
              onChange={(v) => patchData({ currentMp: v >= derived.mp ? null : v })}
            />
            <Tracker
              label="이성"
              current={currentSan}
              max={sanCap}
              hint={`초기 ${derived.san}`}
              disabled={!isOwner}
              onChange={(v) => patchData({ currentSan: v >= sanCap ? null : v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ClickableStatus
              label="일시적 광기"
              active={!!data.status?.temporaryInsanity}
              disabled={!isOwner}
              onToggle={toggleStatus('temporaryInsanity')}
            />
            <ClickableStatus
              label="장기적 광기"
              active={!!data.status?.indefiniteInsanity}
              disabled={!isOwner}
              onToggle={toggleStatus('indefiniteInsanity')}
            />
            <ClickableStatus
              label="중상"
              active={!!data.status?.majorWound}
              disabled={!isOwner}
              onToggle={toggleStatus('majorWound')}
            />
            <ClickableStatus
              label="빈사"
              active={!!data.status?.dying}
              disabled={!isOwner}
              onToggle={toggleStatus('dying')}
            />
          </div>
        </div>
      </section>

      {/* 파생 — 회피·모국어는 기능 섹션에 표시되므로 여기선 순수 파생 3개만 */}
      <section className="mb-6 rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">파생</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="피해 보너스" value={derived.damageBonus} />
          <Stat label="체구" value={derived.build} />
          <Stat label="이동력" value={derived.mov} />
        </div>
      </section>

      <SkillsSection data={data} />
      <WeaponsSection data={data} />
      <WealthPanel data={data} />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SpellsSection data={data} />
        <InventorySection data={data} />
      </div>

      <BackstorySection data={data} />

      {data.notes && (
        <section className="mb-6 rounded-lg border bg-card p-5">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">메모</h2>
          <p className="whitespace-pre-wrap text-sm">{data.notes}</p>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        코코포리아 채팅팔레트 export 는 M2.6 에서 추가됩니다.
      </p>
    </>
  );
}

/** 일러스트 + 기본 정보 세로 리스트. 헤더+특성치 박스의 좌측 절반. */
function ProfileBlock({
  character,
  data,
  inSoloGroup,
}: {
  character: CharacterRow;
  data: CoCData;
  inSoloGroup: boolean;
}) {
  const info = data.info ?? {};
  const rows: { label: string; value: string | number | null | undefined }[] = [
    { label: '직업', value: character.occupation },
    { label: '나이', value: info.age != null ? `${info.age}세` : null },
    { label: '성별', value: info.gender },
    { label: '거주지', value: info.residence },
    { label: '출신지', value: info.birthplace },
    { label: '국적', value: info.nationality },
    { label: '시대', value: info.era },
    { label: '키 / 몸무게', value: info.heightWeight },
  ];

  return (
    <div className="flex gap-4">
      {character.portrait_url ? (
        <img
          src={character.portrait_url}
          alt=""
          className="h-44 w-44 shrink-0 rounded-lg border object-cover sm:h-48 sm:w-48"
        />
      ) : (
        <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground sm:h-48 sm:w-48">
          <User className="h-16 w-16" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{character.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{character.system === 'coc7' ? 'CoC 7판' : character.system}</Badge>
          <Badge>{STATUS_LABEL[character.status] ?? character.status}</Badge>
          {inSoloGroup && <Badge accent>내 작업실</Badge>}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className={r.value ? '' : 'text-muted-foreground/60'}>
                {r.value || '—'}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function WealthPanel({ data }: { data: CoCData }) {
  const credit = data.skills.find((s) => s.key === 'credit_rating');
  if (!credit) return null;
  const total = skillTotal(credit, data.characteristics);
  const wealth = calculateWealth(total);
  const fmt = (n: number | string) =>
    typeof n === 'number' ? n.toLocaleString('ko-KR') : n;

  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">재력</h2>
        <span className="text-xs text-muted-foreground">
          재력 <span className="font-mono tabular-nums text-foreground">{total}</span> ·{' '}
          {wealth.description}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="소비 수준" value={fmt(wealth.spendingLevel)} />
        <Stat label="현금" value={fmt(wealth.cash)} />
        <Stat label="자산" value={fmt(wealth.assets)} />
      </div>
    </section>
  );
}

function SkillsSection({ data }: { data: CoCData }) {
  // 모든 표준 기술 + 분배가 있는 custom 기술을 시트처럼 전체 노출.
  // 0/0 인 표준 기술도 base 값으로 표시 (모국어·회피는 능력치 파생이라 기본값 자동).
  const stored = new Map((data.skills ?? []).map((s) => [s.key, s]));
  const standardRows: CoCSkill[] = COC_STANDARD_SKILLS.map((def) => {
    const s = stored.get(def.key);
    return s ?? { key: def.key, name: def.name, occupation: 0, interest: 0 };
  });
  const customRows: CoCSkill[] = (data.skills ?? []).filter(
    (s) => !COC_SKILL_BY_KEY.has(s.key),
  );
  const allRows = [...standardRows, ...customRows];

  const groups = SKILL_CATEGORY_ORDER.flatMap((cat) => {
    const items = allRows.filter((s) => {
      const def = COC_SKILL_BY_KEY.get(s.key);
      const c = (def?.category ?? 'custom') as SkillCategory;
      return c === cat;
    });
    return items.length > 0 ? [{ category: cat, items }] : [];
  });

  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">기능</h2>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {groups.map(({ category, items }) => (
          <div key={category} className="rounded-md border">
            <div className="border-b bg-muted/30 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {category}
            </div>
            <ul className="divide-y">
              {items.map((s) => {
                const total = skillTotal(s, data.characteristics);
                const allocated = s.occupation > 0 || s.interest > 0;
                const def = COC_SKILL_BY_KEY.get(s.key);
                const isDerived = !!def?.derives;
                return (
                  <li
                    key={s.key}
                    className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                  >
                    <span
                      className={`truncate ${
                        allocated || isDerived ? '' : 'text-muted-foreground'
                      }`}
                      title={s.name}
                    >
                      {s.name}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      <span
                        className={`text-base font-semibold ${
                          allocated || isDerived ? 'text-foreground' : 'text-muted-foreground/70'
                        }`}
                      >
                        {total}
                      </span>
                      {' / '}
                      {Math.floor(total / 2)}
                      {' / '}
                      {Math.floor(total / 5)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function WeaponsSection({ data }: { data: CoCData }) {
  const weapons = data.weapons ?? [];
  if (weapons.length === 0) return null;

  const skillByName = new Map(data.skills.map((s) => [s.name, s]));

  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">무기</h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">무기</th>
              <th className="px-3 py-2 text-left">기능</th>
              <th className="px-3 py-2 text-center">보통</th>
              <th className="px-3 py-2 text-center">어려움</th>
              <th className="px-3 py-2 text-center">대단함</th>
              <th className="px-3 py-2 text-left">피해</th>
              <th className="px-3 py-2 text-left">사거리</th>
              <th className="px-3 py-2 text-left">공격횟수</th>
              <th className="px-3 py-2 text-left">탄약</th>
              <th className="px-3 py-2 text-left">고장</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {weapons.map((w, i) => {
              const skill = w.skill ? skillByName.get(w.skill) : undefined;
              const total = skill ? skillTotal(skill, data.characteristics) : null;
              return (
                <tr key={i}>
                  <td className="px-3 py-2 font-medium">{w.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.skill ?? '—'}</td>
                  <td className="bg-muted/20 px-3 py-2 text-center text-sm font-semibold tabular-nums">
                    {total ?? '—'}
                  </td>
                  <td className="bg-muted/20 px-3 py-2 text-center text-sm tabular-nums text-muted-foreground">
                    {total != null ? Math.floor(total / 2) : '—'}
                  </td>
                  <td className="bg-muted/20 px-3 py-2 text-center text-sm tabular-nums text-muted-foreground">
                    {total != null ? Math.floor(total / 5) : '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{w.damage ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.range ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.attacks ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.ammo ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.malfunction ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SpellsSection({ data }: { data: CoCData }) {
  const spells = data.spells ?? [];
  if (spells.length === 0) return null;
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">주문 / 마법</h2>
      <ul className="space-y-2">
        {spells.map((s, i) => (
          <li key={i} className="rounded-md border bg-background p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{s.name}</span>
              {s.cost && <span className="text-xs text-muted-foreground">{s.cost}</span>}
            </div>
            {s.effect && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{s.effect}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function InventorySection({ data }: { data: CoCData }) {
  const inventory = data.inventory ?? [];
  if (inventory.length === 0) return null;
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">소지품</h2>
      <ul className="divide-y rounded-md border bg-background">
        {inventory.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="flex-1">
              {it.name}
              {it.qty && it.qty > 1 && (
                <span className="ml-1 text-xs text-muted-foreground">×{it.qty}</span>
              )}
            </span>
            {it.notes && <span className="text-xs text-muted-foreground">{it.notes}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BackstorySection({ data }: { data: CoCData }) {
  const bs = data.backstory ?? {};
  const filled = BACKSTORY_LABELS.filter((f) => (bs[f.key] ?? '').trim().length > 0);
  if (filled.length === 0) return null;
  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">백스토리</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filled.map((f) => (
          <div key={f.key} className="rounded-md border bg-background p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{bs[f.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col rounded-md border bg-background px-3 py-2 leading-tight">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

/**
 * 인라인 +/- 트래커. 직접 클릭하면 입력 모드, blur/Enter 로 저장.
 * disabled 면 read-only.
 */
function Tracker({
  label,
  current,
  max,
  hint,
  disabled,
  onChange,
}: {
  label: string;
  current: number;
  max: number;
  hint?: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current);
  useEffect(() => {
    if (!editing) setDraft(current);
  }, [current, editing]);

  const clamp = (n: number) => Math.max(0, Math.min(max, Math.floor(n) || 0));
  const decrement = () => onChange(clamp(current - 1));
  const increment = () => onChange(clamp(current + 1));

  return (
    <div className="flex flex-col rounded-md border bg-background px-3 py-2 leading-tight">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {hint && (
          <span className="text-[9px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-1">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || current <= 0}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30"
          aria-label="감소"
        >
          <Minus className="h-3 w-3" />
        </button>
        {editing ? (
          <input
            type="number"
            min={0}
            max={max}
            value={draft}
            onChange={(e) => setDraft(clamp(Number(e.target.value)))}
            onBlur={() => {
              setEditing(false);
              if (draft !== current) onChange(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraft(current);
                setEditing(false);
              }
            }}
            autoFocus
            className="w-12 bg-transparent text-center text-xl font-semibold tabular-nums outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => !disabled && setEditing(true)}
            disabled={disabled}
            className="flex-1 text-center text-xl font-semibold tabular-nums hover:text-primary disabled:hover:text-foreground"
            title={disabled ? '' : '클릭해 직접 입력'}
          >
            {current}
          </button>
        )}
        <button
          type="button"
          onClick={increment}
          disabled={disabled || current >= max}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30"
          aria-label="증가"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground tabular-nums">/ {max}</p>
    </div>
  );
}

/** 클릭으로 토글되는 상태 칩. 활성이면 destructive 색상. */
function ClickableStatus({
  label,
  active,
  disabled,
  onToggle,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={[
        'rounded-md border px-3 py-2 text-sm transition',
        active
          ? 'border-destructive/50 bg-destructive/10 font-medium text-destructive'
          : 'bg-background text-muted-foreground hover:bg-accent/40',
        disabled && 'cursor-not-allowed opacity-60',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </button>
  );
}

function Badge({
  children,
  accent,
  danger,
}: {
  children: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
}) {
  const cls = danger
    ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive'
    : accent
      ? 'rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary'
      : 'rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground';
  return <span className={cls}>{children}</span>;
}
