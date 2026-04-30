import { Link, Navigate, useOutletContext, useParams } from 'react-router';
import { ArrowLeft, Pencil, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { GroupRow } from '../lib/supabase/database.types';
import { useCharacter } from '../features/characters/api';
import { useSession } from '../features/auth/useSession';
import { COC_GRID_ORDER, COC_LABELS } from '../lib/coc/characteristics';
import { calculateDerived, successTiers } from '../lib/coc/derived';
import {
  COC_SKILL_BY_KEY,
  SKILL_CATEGORY_ORDER,
  type SkillCategory,
} from '../lib/coc/skills';
import { skillTotal } from '../lib/coc/skill-calc';
import type { CoCData } from '../lib/coc/types';

interface GroupOutletContext {
  group: GroupRow;
}

const STATUS_LABEL: Record<string, string> = {
  active: '활동 중',
  retired: '은퇴',
  dead: '사망',
};

export function CharacterDetailPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { characterId } = useParams<{ characterId: string }>();
  const { data: character, isLoading, isError } = useCharacter(characterId);
  const { user } = useSession();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-muted-foreground">
        시트 불러오는 중…
      </div>
    );
  }

  if (isError || !character) {
    return <Navigate to=".." replace relative="path" />;
  }

  // CoC 7판이 아닌 경우는 향후 분기 — 지금은 CoC 만 사용 가능
  const data = (character.data ?? {}) as Partial<CoCData>;
  const isCoC = character.system === 'coc7';
  const isOwner = user?.id === character.owner_id;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
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
      </header>

      <section className="mb-8 flex items-start gap-4 rounded-lg border bg-card p-5">
        {character.portrait_url ? (
          <img
            src={character.portrait_url}
            alt=""
            className="h-20 w-20 rounded-md border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted text-muted-foreground">
            <User className="h-8 w-8" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{character.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {character.occupation ?? '직업 미입력'}
            {data.info?.age ? ` · ${data.info.age}세` : ''}
            {data.info?.gender ? ` · ${data.info.gender}` : ''}
            {data.info?.residence ? ` · ${data.info.residence}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {character.system === 'coc7' ? 'CoC 7판' : character.system}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {STATUS_LABEL[character.status] ?? character.status}
            </span>
            {group.is_solo && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                내 작업실
              </span>
            )}
          </div>
        </div>
      </section>

      {isCoC && data.characteristics && (
        <CoCSheet data={data as CoCData} />
      )}
    </div>
  );
}

function CoCSheet({ data }: { data: CoCData }) {
  const derived = calculateDerived(data.characteristics, data.info?.age ?? null);

  return (
    <>
      {/* 능력치 */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">능력치</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {COC_GRID_ORDER.map((key) => {
            const v = data.characteristics[key];
            const tiers = successTiers(v);
            const label = COC_LABELS[key];
            return (
              <div key={key} className="rounded-md border bg-card px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {key} · {label.ko}
                </p>
                <p className="mt-1 text-2xl font-medium tabular-nums">{v}</p>
                <p className="text-[10px] text-muted-foreground">
                  {v} / {tiers.hard} / {tiers.extreme}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 파생값 */}
      <section className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">자동 계산</h2>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <Stat label="HP" value={derived.hp} />
          <Stat label="MP" value={derived.mp} />
          <Stat label="SAN" value={derived.san} />
          <Stat label="회피" value={derived.dodge} />
          <Stat label="모국어" value={derived.ownLanguage} />
          <Stat label="DB" value={derived.damageBonus} />
          <Stat label="체격" value={derived.build} />
          <Stat label="이동" value={derived.mov} />
        </div>
      </section>

      {/* 기술 */}
      <SkillsSection data={data} />

      {/* 메모 */}
      {data.notes && (
        <section className="mb-6 rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">메모</h2>
          <p className="whitespace-pre-wrap text-sm">{data.notes}</p>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        무기·주문·백스토리·일러스트는 M2.3~M2.4. 코코포리아 채팅팔레트 export 는 M2.6.
      </p>
    </>
  );
}

function SkillsSection({ data }: { data: CoCData }) {
  // 분배가 0/0 인 표준 기술도 표시할지 결정 — 일단 분배가 있는 것 + 능력치 파생만.
  const meaningful = (data.skills ?? []).filter((s) => {
    if (s.occupation > 0 || s.interest > 0) return true;
    const def = COC_SKILL_BY_KEY.get(s.key);
    return !!def?.derives;
  });

  if (meaningful.length === 0) return null;

  // 카테고리별 그룹핑
  const groups = SKILL_CATEGORY_ORDER.flatMap((cat) => {
    const items = meaningful.filter((s) => {
      const def = COC_SKILL_BY_KEY.get(s.key);
      const c = (def?.category ?? 'custom') as SkillCategory;
      return c === cat;
    });
    return items.length > 0 ? [{ category: cat, items }] : [];
  });

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">기술</h2>
      <div className="space-y-3">
        {groups.map(({ category, items }) => (
          <div key={category} className="rounded-md border bg-card">
            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              {category}
            </div>
            <ul className="divide-y">
              {items.map((s) => {
                const total = skillTotal(s, data.characteristics);
                const hard = Math.floor(total / 2);
                const extreme = Math.floor(total / 5);
                return (
                  <li
                    key={s.key}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span>{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      <span className="font-medium text-foreground">{total}</span>
                      <span className="ml-2 text-xs">/ {hard}</span>
                      <span className="ml-1 text-xs">/ {extreme}</span>
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-lg font-medium tabular-nums">{value}</span>
    </div>
  );
}
