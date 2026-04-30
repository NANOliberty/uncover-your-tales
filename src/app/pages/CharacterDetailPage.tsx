import { Link, Navigate, useOutletContext, useParams } from 'react-router';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { GroupRow } from '../lib/supabase/database.types';
import { useCharacter } from '../features/characters/api';
import { COC_GRID_ORDER, COC_LABELS } from '../lib/coc/characteristics';
import { calculateDerived, successTiers } from '../lib/coc/derived';
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link to=".." relative="path">
              <ArrowLeft className="mr-1 h-4 w-4" />
              목록
            </Link>
          </Button>
        </div>
        {/* M2.2 에서 편집 페이지 추가 후 노출 */}
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

      {/* 메모 */}
      {data.notes && (
        <section className="mb-6 rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">메모</h2>
          <p className="whitespace-pre-wrap text-sm">{data.notes}</p>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        기술·무기·주문·백스토리·일러스트는 다음 마일스톤(M2.2~M2.4) 에 추가됩니다.
        코코포리아 채팅팔레트 export 는 M2.6.
      </p>
    </>
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
