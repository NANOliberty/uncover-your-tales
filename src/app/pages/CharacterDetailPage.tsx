import { Link, Navigate, useOutletContext, useParams } from 'react-router';
import { ArrowLeft, Pencil, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { GroupRow } from '../lib/supabase/database.types';
import { useCharacter } from '../features/characters/api';
import { useSession } from '../features/auth/useSession';
import { COC_GRID_ORDER, COC_LABELS } from '../lib/coc/characteristics';
import { calculateDerived } from '../lib/coc/derived';
import {
  COC_SKILL_BY_KEY,
  SKILL_CATEGORY_ORDER,
  type SkillCategory,
} from '../lib/coc/skills';
import { skillTotal } from '../lib/coc/skill-calc';
import type { CoCBackstory, CoCData } from '../lib/coc/types';

interface GroupOutletContext {
  group: GroupRow;
}

const STATUS_LABEL: Record<string, string> = {
  active: '활동 중',
  retired: '은퇴',
  dead: '사망',
};

const BACKSTORY_LABELS: { key: keyof CoCBackstory; label: string }[] = [
  { key: 'personalDescription', label: '개인 묘사' },
  { key: 'ideologyBeliefs', label: '사상 / 신념' },
  { key: 'significantPeople', label: '중요한 사람들' },
  { key: 'meaningfulLocations', label: '의미 있는 장소' },
  { key: 'treasuredPossessions', label: '소중한 소유물' },
  { key: 'traits', label: '특성' },
  { key: 'injuriesScars', label: '부상과 흉터' },
  { key: 'phobiasManias', label: '공포증 / 매니아' },
  { key: 'thirdPartyEntities', label: '신비한 만남' },
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
        {isOwner && (
          <Button asChild size="sm">
            <Link to="edit">
              <Pencil className="mr-1 h-3 w-3" />
              편집
            </Link>
          </Button>
        )}
      </div>

      {/* 헤더 */}
      <header className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-start">
        {character.portrait_url ? (
          <img
            src={character.portrait_url}
            alt=""
            className="h-28 w-28 shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <User className="h-10 w-10" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{character.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {character.occupation ?? '직업 미입력'}
            {data.info?.age != null ? ` · ${data.info.age}세` : ''}
            {data.info?.gender ? ` · ${data.info.gender}` : ''}
            {data.info?.residence ? ` · ${data.info.residence}` : ''}
            {data.info?.birthplace ? ` · ${data.info.birthplace} 출신` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{character.system === 'coc7' ? 'CoC 7판' : character.system}</Badge>
            <Badge>{STATUS_LABEL[character.status] ?? character.status}</Badge>
            {group.is_solo && <Badge accent>내 작업실</Badge>}
          </div>
        </div>
      </header>

      {isCoC && data.characteristics && <CoCSheet data={data as CoCData} />}
    </div>
  );
}

function CoCSheet({ data }: { data: CoCData }) {
  const derived = calculateDerived(data.characteristics, data.info?.age ?? null);

  return (
    <>
      {/* 능력치 + 자동 계산 */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">능력치</h2>
          <div className="grid grid-cols-3 gap-2">
            {COC_GRID_ORDER.map((key) => {
              const v = data.characteristics[key];
              const label = COC_LABELS[key];
              return (
                <div key={key} className="rounded-md border bg-background px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {key} · {label.ko}
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
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">자동 계산</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="HP" value={derived.hp} />
            <Stat label="MP" value={derived.mp} />
            <Stat label="SAN" value={derived.san} />
            <Stat label="회피" value={derived.dodge} />
            <Stat label="모국어" value={derived.ownLanguage} />
            <Stat label="DB" value={derived.damageBonus} />
            <Stat label="체격" value={derived.build} />
            <Stat label="이동" value={derived.mov} />
          </div>
        </div>
      </section>

      <SkillsSection data={data} />
      <WeaponsSection data={data} />

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

function SkillsSection({ data }: { data: CoCData }) {
  const meaningful = (data.skills ?? []).filter((s) => {
    if (s.occupation > 0 || s.interest > 0) return true;
    const def = COC_SKILL_BY_KEY.get(s.key);
    return !!def?.derives;
  });
  if (meaningful.length === 0) return null;

  const groups = SKILL_CATEGORY_ORDER.flatMap((cat) => {
    const items = meaningful.filter((s) => {
      const def = COC_SKILL_BY_KEY.get(s.key);
      const c = (def?.category ?? 'custom') as SkillCategory;
      return c === cat;
    });
    return items.length > 0 ? [{ category: cat, items }] : [];
  });

  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">기술</h2>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {groups.map(({ category, items }) => (
          <div key={category} className="rounded-md border">
            <div className="border-b bg-muted/30 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {category}
            </div>
            <ul className="divide-y">
              {items.map((s) => {
                const total = skillTotal(s, data.characteristics);
                return (
                  <li
                    key={s.key}
                    className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate" title={s.name}>
                      {s.name}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      <span className="text-base font-semibold text-foreground">{total}</span>
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
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-left">기술</th>
              <th className="px-3 py-2 text-left">데미지</th>
              <th className="px-3 py-2 text-left">사거리</th>
              <th className="px-3 py-2 text-left">공격</th>
              <th className="px-3 py-2 text-left">탄창</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {weapons.map((w, i) => {
              const skill = w.skill ? skillByName.get(w.skill) : undefined;
              const total = skill ? skillTotal(skill, data.characteristics) : null;
              return (
                <tr key={i}>
                  <td className="px-3 py-2 font-medium">{w.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {w.skill ?? '—'}
                    {total != null && (
                      <span className="ml-1 tabular-nums text-foreground">({total})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{w.damage ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.range ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.attacks ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{w.ammo ?? '—'}</td>
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col rounded-md border bg-background px-3 py-2 leading-tight">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Badge({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={
        accent
          ? 'rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary'
          : 'rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'
      }
    >
      {children}
    </span>
  );
}
