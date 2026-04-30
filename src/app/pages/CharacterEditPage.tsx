import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import type { GroupRow } from '../lib/supabase/database.types';
import { useCharacter } from '../features/characters/api';
import { useUpdateCharacter } from '../features/characters/mutations';
import { useSession } from '../features/auth/useSession';
import { PortraitUploader } from '../features/characters/PortraitUploader';
import { COC_GRID_ORDER, COC_LABELS } from '../lib/coc/characteristics';
import { calculateDerived } from '../lib/coc/derived';
import {
  COC_STANDARD_SKILLS,
  COC_SKILL_BY_KEY,
  SKILL_CATEGORY_ORDER,
  type SkillCategory,
} from '../lib/coc/skills';
import { calculatePools, skillBase, skillTotal } from '../lib/coc/skill-calc';
import {
  emptyCoCData,
  type CoCBackstory,
  type CoCCharacteristic,
  type CoCCharacteristics,
  type CoCData,
  type CoCInventoryItem,
  type CoCSkill,
  type CoCSpell,
  type CoCWeapon,
} from '../lib/coc/types';

interface GroupOutletContext {
  group: GroupRow;
}

const BACKSTORY_FIELDS: { key: keyof CoCBackstory; label: string; placeholder: string }[] = [
  { key: 'personalDescription', label: '개인 묘사', placeholder: '외모, 분위기, 첫 인상' },
  { key: 'ideologyBeliefs', label: '사상 / 신념', placeholder: '신념, 종교, 가치관' },
  { key: 'significantPeople', label: '중요한 사람들', placeholder: '가족, 친구, 라이벌' },
  { key: 'meaningfulLocations', label: '의미 있는 장소', placeholder: '고향, 자주 가는 곳' },
  { key: 'treasuredPossessions', label: '소중한 소유물', placeholder: '아끼는 물건' },
  { key: 'traits', label: '특성', placeholder: '말버릇, 습관, 성격적 특이점' },
  { key: 'injuriesScars', label: '부상과 흉터', placeholder: '몸에 남은 흔적' },
  { key: 'phobiasManias', label: '공포증 / 매니아', placeholder: '두려운 것, 집착하는 것' },
  { key: 'thirdPartyEntities', label: '신비한 만남', placeholder: '마도서·주문·미지 존재 등' },
];

export function CharacterEditPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: character, isLoading } = useCharacter(characterId);
  const update = useUpdateCharacter();

  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [residence, setResidence] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [characteristics, setCharacteristics] = useState<CoCCharacteristics>(
    emptyCoCData().characteristics,
  );
  const [skills, setSkills] = useState<CoCSkill[]>([]);
  const [weapons, setWeapons] = useState<CoCWeapon[]>([]);
  const [spells, setSpells] = useState<CoCSpell[]>([]);
  const [inventory, setInventory] = useState<CoCInventoryItem[]>([]);
  const [backstory, setBackstory] = useState<CoCBackstory>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!character) return;
    const data = (character.data ?? emptyCoCData()) as CoCData;
    setName(character.name);
    setOccupation(character.occupation ?? '');
    setPortraitUrl(character.portrait_url ?? null);
    setAge(data.info?.age ?? '');
    setGender(data.info?.gender ?? '');
    setResidence(data.info?.residence ?? '');
    setBirthplace(data.info?.birthplace ?? '');
    setCharacteristics({ ...emptyCoCData().characteristics, ...(data.characteristics ?? {}) });
    const saved = new Map<string, CoCSkill>((data.skills ?? []).map((s) => [s.key, s]));
    const merged: CoCSkill[] = COC_STANDARD_SKILLS.map((def) => ({
      key: def.key,
      name: def.name,
      occupation: saved.get(def.key)?.occupation ?? 0,
      interest: saved.get(def.key)?.interest ?? 0,
    }));
    for (const s of data.skills ?? []) {
      if (!COC_SKILL_BY_KEY.has(s.key)) merged.push({ ...s, custom: true });
    }
    setSkills(merged);
    setWeapons(data.weapons ?? []);
    setSpells(data.spells ?? []);
    setInventory(data.inventory ?? []);
    setBackstory(data.backstory ?? {});
    setNotes(data.notes ?? '');
  }, [character]);

  const derived = useMemo(
    () => calculateDerived(characteristics, age === '' ? null : age),
    [characteristics, age],
  );
  const pools = useMemo(
    () => calculatePools(characteristics, skills),
    [characteristics, skills],
  );

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">불러오는 중…</div>;
  }
  if (!character) return <Navigate to=".." replace relative="path" />;
  if (user && character.owner_id !== user.id) {
    return <Navigate to={`/g/${group.slug}/characters/${character.id}`} replace />;
  }

  const setStat = (k: CoCCharacteristic, v: number) =>
    setCharacteristics((prev) => ({ ...prev, [k]: Math.max(0, Math.min(99, v || 0)) }));
  const updateSkill = (key: string, patch: Partial<CoCSkill>) =>
    setSkills((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const addCustomSkill = () => {
    const n = window.prompt('기술 이름?')?.trim();
    if (!n) return;
    const key = `custom_${n.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    setSkills((prev) => [...prev, { key, name: n, occupation: 0, interest: 0, custom: true }]);
  };
  const removeCustomSkill = (key: string) =>
    setSkills((prev) => prev.filter((s) => s.key !== key));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('이름을 입력하세요');
      return;
    }
    setSubmitting(true);
    try {
      const compactedSkills = skills.filter((s) => !(s.custom && !s.occupation && !s.interest));
      const data: CoCData = {
        v: 1,
        info: {
          age: age === '' ? null : age,
          gender: gender || null,
          residence: residence || null,
          birthplace: birthplace || null,
        },
        characteristics,
        skills: compactedSkills,
        weapons: weapons.filter((w) => w.name?.trim()),
        spells: spells.filter((s) => s.name?.trim()),
        inventory: inventory.filter((i) => i.name?.trim()),
        backstory,
        notes,
      };

      await update.mutateAsync({
        id: character.id,
        patch: {
          name: name.trim(),
          occupation: occupation.trim() || null,
          portrait_url: portraitUrl,
          data: data as unknown as Record<string, unknown>,
        },
      });
      toast.success('저장되었어요');
      navigate(`/g/${group.slug}/characters/${character.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[update-character] failed:', err);
      const e = (err ?? {}) as { message?: string };
      toast.error(`저장 실패: ${e.message || (err instanceof Error ? err.message : '알 수 없는 오류')}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 카테고리별 그룹핑 (편집 표시는 모든 표준 기술 + custom 도)
  const grouped = SKILL_CATEGORY_ORDER.flatMap((cat) => {
    const items = skills.filter((s) => {
      const def = COC_SKILL_BY_KEY.get(s.key);
      const c = (def?.category ?? 'custom') as SkillCategory;
      return c === cat;
    });
    return items.length > 0 ? [{ category: cat, items }] : [];
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <p className="text-xs text-muted-foreground">{group.is_solo ? '내 작업실' : group.name}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          {character.name} 편집
        </h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* 기본 정보 + 일러스트 */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">기본 정보</h2>
          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <PortraitUploader
              value={portraitUrl}
              characterId={character.id}
              userId={character.owner_id}
              onChange={setPortraitUrl}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="이름 *">
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </Field>
              <Field label="직업">
                <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
              </Field>
              <Field label="나이">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) =>
                    setAge(
                      e.target.value === ''
                        ? ''
                        : Math.max(1, Math.min(120, Number(e.target.value) || 0)),
                    )
                  }
                />
              </Field>
              <Field label="성별">
                <Input value={gender} onChange={(e) => setGender(e.target.value)} />
              </Field>
              <Field label="거주지">
                <Input value={residence} onChange={(e) => setResidence(e.target.value)} />
              </Field>
              <Field label="출신지">
                <Input value={birthplace} onChange={(e) => setBirthplace(e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        {/* 능력치 — 풀 폭 */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">능력치</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-9">
            {COC_GRID_ORDER.map((key) => (
              <BigCharInput
                key={key}
                code={key}
                value={characteristics[key]}
                onChange={(v) => setStat(key, v)}
              />
            ))}
          </div>
        </section>

        {/* 자동 계산 — 풀 폭 banner */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">자동 계산</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8 text-sm">
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
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">기술</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Pool label="직업" hint="EDU×4" used={pools.occupationUsed} max={pools.occupationMax} />
              <Pool label="흥미" hint="INT×2" used={pools.interestUsed} max={pools.interestMax} />
              <Button type="button" size="sm" variant="outline" onClick={addCustomSkill}>
                <Plus className="mr-1 h-3 w-3" />
                기술 추가
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {grouped.map(({ category, items }) => (
              <div key={category} className="rounded-md border">
                <div className="border-b bg-muted/30 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {category}
                </div>
                <ul className="divide-y">
                  {items.map((s) => {
                    const base = skillBase(s.key, characteristics);
                    const total = skillTotal(s, characteristics);
                    const def = COC_SKILL_BY_KEY.get(s.key);
                    return (
                      <li
                        key={s.key}
                        className="grid grid-cols-12 items-center gap-1 px-2 py-1.5 text-xs"
                      >
                        <div className="col-span-5 flex min-w-0 items-center gap-1">
                          <span className="truncate" title={s.name}>
                            {s.name}
                          </span>
                          {def?.derives && (
                            <span className="rounded bg-muted px-1 text-[9px] text-muted-foreground">
                              파생
                            </span>
                          )}
                          {s.custom && (
                            <button
                              type="button"
                              onClick={() => removeCustomSkill(s.key)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <span className="col-span-1 text-center text-muted-foreground tabular-nums">
                          {base}
                        </span>
                        <NumInput
                          value={s.occupation}
                          onChange={(v) => updateSkill(s.key, { occupation: v })}
                        />
                        <NumInput
                          value={s.interest}
                          onChange={(v) => updateSkill(s.key, { interest: v })}
                        />
                        <span className="col-span-2 text-right text-sm font-medium tabular-nums">
                          {total}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            열 순서: 기술 / 기본 / 직업 / 흥미 / 합계. 회피·모국어는 능력치 변경 시 기본값이 즉시 갱신됩니다.
          </p>
        </section>

        {/* 무기 */}
        <RepeatableSection
          title="무기"
          empty="아직 등록된 무기가 없습니다."
          items={weapons}
          add={() =>
            setWeapons((prev) => [
              ...prev,
              { name: '', skill: '', damage: '', range: '', attacks: '', ammo: null, malfunction: null },
            ])
          }
        >
          {weapons.map((w, i) => (
            <li key={i} className="grid gap-2 border-b px-3 py-2 last:border-b-0 sm:grid-cols-12">
              <RowInput
                placeholder="이름 (예: 권총)"
                value={w.name}
                onChange={(v) =>
                  setWeapons((prev) => prev.map((x, j) => (j === i ? { ...x, name: v } : x)))
                }
                cols={3}
              />
              <RowInput
                placeholder="기술 (예: 사격(권총))"
                value={w.skill ?? ''}
                onChange={(v) =>
                  setWeapons((prev) => prev.map((x, j) => (j === i ? { ...x, skill: v } : x)))
                }
                cols={3}
              />
              <RowInput
                placeholder="데미지"
                value={w.damage ?? ''}
                onChange={(v) =>
                  setWeapons((prev) => prev.map((x, j) => (j === i ? { ...x, damage: v } : x)))
                }
                cols={2}
              />
              <RowInput
                placeholder="사거리"
                value={w.range ?? ''}
                onChange={(v) =>
                  setWeapons((prev) => prev.map((x, j) => (j === i ? { ...x, range: v } : x)))
                }
                cols={1}
              />
              <RowInput
                placeholder="공격"
                value={w.attacks ?? ''}
                onChange={(v) =>
                  setWeapons((prev) => prev.map((x, j) => (j === i ? { ...x, attacks: v } : x)))
                }
                cols={1}
              />
              <RowInput
                placeholder="탄창"
                value={w.ammo ?? ''}
                onChange={(v) =>
                  setWeapons((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, ammo: v || null } : x)),
                  )
                }
                cols={1}
              />
              <RemoveCell onRemove={() => setWeapons((prev) => prev.filter((_, j) => j !== i))} />
            </li>
          ))}
        </RepeatableSection>

        {/* 주문 / 인벤 — 2열 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RepeatableSection
            title="주문 / 마법"
            empty="주문이 필요한 캐릭터만 채우세요."
            items={spells}
            add={() => setSpells((prev) => [...prev, { name: '', cost: '', effect: '' }])}
          >
            {spells.map((s, i) => (
              <li key={i} className="grid gap-2 border-b px-3 py-2 last:border-b-0 sm:grid-cols-12">
                <RowInput
                  placeholder="이름"
                  value={s.name}
                  onChange={(v) =>
                    setSpells((prev) => prev.map((x, j) => (j === i ? { ...x, name: v } : x)))
                  }
                  cols={4}
                />
                <RowInput
                  placeholder="비용 (5MP, 1d6 SAN)"
                  value={s.cost ?? ''}
                  onChange={(v) =>
                    setSpells((prev) => prev.map((x, j) => (j === i ? { ...x, cost: v } : x)))
                  }
                  cols={3}
                />
                <RowInput
                  placeholder="효과"
                  value={s.effect ?? ''}
                  onChange={(v) =>
                    setSpells((prev) => prev.map((x, j) => (j === i ? { ...x, effect: v } : x)))
                  }
                  cols={4}
                />
                <RemoveCell onRemove={() => setSpells((prev) => prev.filter((_, j) => j !== i))} />
              </li>
            ))}
          </RepeatableSection>

          <RepeatableSection
            title="소지품"
            empty="아직 비어있습니다."
            items={inventory}
            add={() => setInventory((prev) => [...prev, { name: '', qty: 1, notes: '' }])}
          >
            {inventory.map((it, i) => (
              <li key={i} className="grid gap-2 border-b px-3 py-2 last:border-b-0 sm:grid-cols-12">
                <RowInput
                  placeholder="이름"
                  value={it.name}
                  onChange={(v) =>
                    setInventory((prev) => prev.map((x, j) => (j === i ? { ...x, name: v } : x)))
                  }
                  cols={5}
                />
                <input
                  type="number"
                  min={1}
                  placeholder="수량"
                  value={it.qty ?? 1}
                  onChange={(e) =>
                    setInventory((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x,
                      ),
                    )
                  }
                  className="rounded-md border bg-input-background px-2 py-1.5 text-sm tabular-nums outline-none focus:border-ring sm:col-span-2"
                />
                <RowInput
                  placeholder="메모"
                  value={it.notes ?? ''}
                  onChange={(v) =>
                    setInventory((prev) => prev.map((x, j) => (j === i ? { ...x, notes: v } : x)))
                  }
                  cols={4}
                />
                <RemoveCell
                  onRemove={() => setInventory((prev) => prev.filter((_, j) => j !== i))}
                />
              </li>
            ))}
          </RepeatableSection>
        </div>

        {/* 백스토리 */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">백스토리</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {BACKSTORY_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Textarea
                  rows={3}
                  value={backstory[f.key] ?? ''}
                  onChange={(e) => setBackstory((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 메모 */}
        <section className="rounded-lg border bg-card p-5">
          <Label htmlFor="notes" className="mb-1 block text-sm font-medium text-muted-foreground">
            메모
          </Label>
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="자유 메모"
          />
        </section>

        <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/g/${group.slug}/characters/${character.id}`)}
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

// ── helpers ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function BigCharInput({
  code,
  value,
  onChange,
}: {
  code: CoCCharacteristic;
  value: number;
  onChange: (v: number) => void;
}) {
  const label = COC_LABELS[code];
  return (
    <label className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2 hover:border-primary/40">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {code} · {label.ko}
      </span>
      <input
        type="number"
        min={1}
        max={99}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent text-3xl font-semibold tabular-nums outline-none"
      />
      <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
        {value} / {Math.floor(value / 2)} / {Math.floor(value / 5)}
      </span>
    </label>
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

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value || ''}
      onChange={(e) => onChange(Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
      className="col-span-2 w-full bg-transparent text-center text-xs tabular-nums outline-none"
    />
  );
}

function Pool({
  label,
  hint,
  used,
  max,
}: {
  label: string;
  hint: string;
  used: number;
  max: number;
}) {
  const remaining = max - used;
  const over = remaining < 0;
  return (
    <div className="flex items-center gap-1 rounded-md border bg-background px-2 py-1">
      <span className="text-[10px] text-muted-foreground">
        {label} <span className="opacity-60">({hint})</span>
      </span>
      <span className={`tabular-nums ${over ? 'text-destructive' : ''}`}>
        {used}/{max}
      </span>
    </div>
  );
}

function RepeatableSection({
  title,
  empty,
  items,
  add,
  children,
}: {
  title: string;
  empty: string;
  items: unknown[];
  add: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed bg-background px-3 py-3 text-center text-xs text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-md border">{children}</ul>
      )}
    </section>
  );
}

function RowInput({
  value,
  onChange,
  placeholder,
  cols,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  cols: 1 | 2 | 3 | 4 | 5;
}) {
  // Tailwind JIT 가 동적 문자열은 못 잡으므로 정적 매핑.
  const colClass = {
    1: 'sm:col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-3',
    4: 'sm:col-span-4',
    5: 'sm:col-span-5',
  }[cols];
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${colClass} rounded-md border bg-input-background px-2 py-1.5 text-sm outline-none focus:border-ring`}
    />
  );
}

function RemoveCell({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive sm:col-span-1"
      aria-label="삭제"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
