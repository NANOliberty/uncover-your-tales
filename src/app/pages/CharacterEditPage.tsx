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
  type CoCCharacteristic,
  type CoCCharacteristics,
  type CoCData,
  type CoCSkill,
} from '../lib/coc/types';

interface GroupOutletContext {
  group: GroupRow;
}

export function CharacterEditPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: character, isLoading } = useCharacter(characterId);
  const update = useUpdateCharacter();

  // 폼 상태
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [residence, setResidence] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [characteristics, setCharacteristics] = useState<CoCCharacteristics>(
    emptyCoCData().characteristics,
  );
  const [skills, setSkills] = useState<CoCSkill[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 캐릭터 로드 시 폼 채우기
  useEffect(() => {
    if (!character) return;
    const data = (character.data ?? emptyCoCData()) as CoCData;
    setName(character.name);
    setOccupation(character.occupation ?? '');
    setAge(data.info?.age ?? '');
    setGender(data.info?.gender ?? '');
    setResidence(data.info?.residence ?? '');
    setBirthplace(data.info?.birthplace ?? '');
    setCharacteristics({ ...emptyCoCData().characteristics, ...(data.characteristics ?? {}) });
    // 표준 기술 + 저장된 분배값을 머지. 저장된 게 없으면 모든 표준 기술을 0/0 으로 채워 표시.
    const saved = new Map<string, CoCSkill>(
      (data.skills ?? []).map((s) => [s.key, s]),
    );
    const merged: CoCSkill[] = COC_STANDARD_SKILLS.map((def) => ({
      key: def.key,
      name: def.name,
      occupation: saved.get(def.key)?.occupation ?? 0,
      interest: saved.get(def.key)?.interest ?? 0,
    }));
    // 저장돼 있지만 표준에 없는 custom 기술도 유지
    for (const s of data.skills ?? []) {
      if (!COC_SKILL_BY_KEY.has(s.key)) {
        merged.push({ ...s, custom: true });
      }
    }
    setSkills(merged);
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
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-muted-foreground">불러오는 중…</div>
    );
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
    const name = window.prompt('기술 이름?')?.trim();
    if (!name) return;
    const key = `custom_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    setSkills((prev) => [...prev, { key, name, occupation: 0, interest: 0, custom: true }]);
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
      // 0 인 항목도 저장 (표준 기술 표시 일관성 위해). custom 은 0/0 이면 제거.
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
        weapons: [],
        spells: [],
        inventory: [],
        backstory: {},
        notes,
      };

      await update.mutateAsync({
        id: character.id,
        patch: {
          name: name.trim(),
          occupation: occupation.trim() || null,
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

  // 카테고리별 그룹핑
  const grouped = SKILL_CATEGORY_ORDER.flatMap((cat) => {
    const items = skills.filter((s) => {
      const def = COC_SKILL_BY_KEY.get(s.key);
      const c = (def?.category ?? 'custom') as SkillCategory;
      return c === cat;
    });
    return items.length > 0 ? [{ category: cat, items }] : [];
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{group.is_solo ? '내 작업실' : group.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{character.name} 편집</h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        {/* 기본 정보 */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium">기본 정보</h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
                    e.target.value === '' ? '' : Math.max(1, Math.min(120, Number(e.target.value) || 0)),
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
        </section>

        {/* 능력치 */}
        <section>
          <h2 className="mb-3 text-sm font-medium">능력치</h2>
          <div className="grid grid-cols-3 gap-3">
            {COC_GRID_ORDER.map((key) => (
              <label
                key={key}
                className="flex flex-col gap-1 rounded-md border bg-card px-3 py-2"
              >
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {key} · {COC_LABELS[key].ko}
                </span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={characteristics[key] || ''}
                  onChange={(e) => setStat(key, Number(e.target.value))}
                  className="w-full bg-transparent text-2xl font-medium tabular-nums outline-none"
                />
                <span className="text-[10px] text-muted-foreground">
                  / 2 = {Math.floor(characteristics[key] / 2)} · / 5 ={' '}
                  {Math.floor(characteristics[key] / 5)}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* 자동 계산 */}
        <section className="rounded-lg border bg-card p-4">
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
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">기술</h2>
            <Button type="button" size="sm" variant="outline" onClick={addCustomSkill}>
              <Plus className="mr-1 h-3 w-3" />기술 추가
            </Button>
          </div>

          <div className="mb-3 grid gap-2 rounded-md border bg-card px-3 py-2 text-xs sm:grid-cols-2">
            <PoolStat
              label="직업 포인트"
              hint="EDU × 4"
              used={pools.occupationUsed}
              max={pools.occupationMax}
            />
            <PoolStat
              label="흥미 포인트"
              hint="INT × 2"
              used={pools.interestUsed}
              max={pools.interestMax}
            />
          </div>

          <div className="space-y-4">
            {grouped.map(({ category, items }) => (
              <div key={category} className="rounded-md border bg-card">
                <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
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
                        className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-sm"
                      >
                        <div className="col-span-5 flex items-center gap-1">
                          <span>{s.name}</span>
                          {def?.derives && (
                            <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
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
                        <div className="col-span-2 text-center text-xs text-muted-foreground">
                          기본 {base}
                        </div>
                        <PointInput
                          label="직업"
                          value={s.occupation}
                          onChange={(v) => updateSkill(s.key, { occupation: v })}
                        />
                        <PointInput
                          label="흥미"
                          value={s.interest}
                          onChange={(v) => updateSkill(s.key, { interest: v })}
                        />
                        <div className="col-span-1 text-right text-base font-medium tabular-nums">
                          {total}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 메모 */}
        <section>
          <Label htmlFor="notes" className="mb-1 block">
            메모
          </Label>
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="자유 메모. 백스토리 / 일러스트는 다음 단계(M2.4)."
          />
        </section>

        <div className="flex items-center justify-end gap-2 pt-2">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
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

function PointInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="col-span-2 flex flex-col leading-tight">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        max={99}
        value={value || ''}
        onChange={(e) => onChange(Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
        className="w-full bg-transparent text-sm tabular-nums outline-none"
      />
    </label>
  );
}

function PoolStat({
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
    <div className="flex items-center justify-between">
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      </div>
      <div className="text-right leading-tight">
        <span className={over ? 'text-destructive' : 'text-foreground'}>
          {used} / {max}
        </span>
        <span className="ml-1 text-[10px] text-muted-foreground">
          ({over ? '초과' : '남음'} {Math.abs(remaining)})
        </span>
      </div>
    </div>
  );
}
