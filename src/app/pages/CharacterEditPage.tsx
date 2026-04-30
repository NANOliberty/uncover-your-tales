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
import { calculateDerived, maxSanity } from '../lib/coc/derived';
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
  type CoCStatus,
  type CoCWeapon,
} from '../lib/coc/types';

interface GroupOutletContext {
  group: GroupRow;
}

const BACKSTORY_FIELDS: { key: keyof CoCBackstory; label: string; placeholder: string }[] = [
  { key: 'personalDescription', label: '겉보기', placeholder: '외모, 분위기, 첫 인상' },
  { key: 'traits', label: '성격', placeholder: '말버릇, 습관, 성격적 특이점' },
  { key: 'ideologyBeliefs', label: '사상·신념', placeholder: '신념, 종교, 가치관' },
  { key: 'significantPeople', label: '중요한 사람들', placeholder: '가족, 친구, 라이벌' },
  { key: 'meaningfulLocations', label: '소중한 장소', placeholder: '고향, 자주 가는 곳' },
  { key: 'treasuredPossessions', label: '소중한 소유물', placeholder: '아끼는 물건' },
  { key: 'injuriesScars', label: '부상과 흉터', placeholder: '몸에 남은 흔적' },
  { key: 'phobiasManias', label: '공포증과 집착증', placeholder: '두려운 것, 집착하는 것' },
  { key: 'thirdPartyEntities', label: '이상한 경험', placeholder: '미지 존재와의 만남, 초자연적 경험' },
  { key: 'tomesAndArtifacts', label: '신화서·주문·유물', placeholder: '읽은 마도서, 알게 된 주문, 입수한 유물' },
  { key: 'otherNotes', label: '기타 사항', placeholder: '그 외 자유 메모' },
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
  const [heightWeight, setHeightWeight] = useState('');
  const [nationality, setNationality] = useState('');
  const [era, setEra] = useState('');
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<CoCStatus>({});
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
    setHeightWeight(data.info?.heightWeight ?? '');
    setNationality(data.info?.nationality ?? '');
    setEra(data.info?.era ?? '');
    setStatus(data.status ?? {});
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
  const sanCap = useMemo(() => {
    const m = skills.find((s) => s.key === 'cthulhu_mythos');
    const total = m ? skillTotal(m, characteristics) : 0;
    return maxSanity(total);
  }, [skills, characteristics]);

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
          heightWeight: heightWeight || null,
          nationality: nationality || null,
          era: era || null,
        },
        characteristics,
        skills: compactedSkills,
        weapons: weapons.filter((w) => w.name?.trim()),
        spells: spells.filter((s) => s.name?.trim()),
        inventory: inventory.filter((i) => i.name?.trim()),
        backstory,
        status,
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
              <Field label="키 / 몸무게">
                <Input
                  value={heightWeight}
                  onChange={(e) => setHeightWeight(e.target.value)}
                  placeholder="170cm / 65kg"
                />
              </Field>
              <Field label="국적">
                <Input value={nationality} onChange={(e) => setNationality(e.target.value)} />
              </Field>
              <Field label="시대">
                <Input
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="현대, 1920년대 등"
                />
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
            <Stat label="체력" value={derived.hp} />
            <Stat label="마력" value={derived.mp} />
            <Stat label="이성" value={`${derived.san} / ${sanCap}`} hint="초기/최대" />
            <Stat label="회피" value={derived.dodge} />
            <Stat label="모국어" value={derived.ownLanguage} />
            <Stat label="피해 보너스" value={derived.damageBonus} />
            <Stat label="체구" value={derived.build} />
            <Stat label="이동력" value={derived.mov} />
          </div>
        </section>

        {/* 상태 트래커 */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">상태</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            <StatusToggle
              label="일시적 광기"
              checked={!!status.temporaryInsanity}
              onChange={(v) => setStatus((s) => ({ ...s, temporaryInsanity: v }))}
            />
            <StatusToggle
              label="장기적 광기"
              checked={!!status.indefiniteInsanity}
              onChange={(v) => setStatus((s) => ({ ...s, indefiniteInsanity: v }))}
            />
            <StatusToggle
              label="중상"
              checked={!!status.majorWound}
              onChange={(v) => setStatus((s) => ({ ...s, majorWound: v }))}
            />
            <StatusToggle
              label="빈사"
              checked={!!status.dying}
              onChange={(v) => setStatus((s) => ({ ...s, dying: v }))}
            />
          </div>
        </section>

        {/* 기술 */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">기능</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Pool label="직업" hint="EDU×4" used={pools.occupationUsed} max={pools.occupationMax} />
              <Pool label="흥미" hint="INT×2" used={pools.interestUsed} max={pools.interestMax} />
              <Button type="button" size="sm" variant="outline" onClick={addCustomSkill}>
                <Plus className="mr-1 h-3 w-3" />
                기능 추가
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
            열 순서: 기능 / 기본 / 직업 / 흥미 / 합계. 회피·모국어는 능력치 변경 시 기본값이 즉시 갱신됩니다.
          </p>
        </section>

        {/* 무기 */}
        {/* 무기 — 컴팩트 표 */}
        <TableSection
          title="무기"
          add={() =>
            setWeapons((prev) => [
              ...prev,
              { name: '', skill: '', damage: '', range: '', attacks: '', ammo: null, malfunction: null },
            ])
          }
        >
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th w="16%">무기</Th>
                <Th w="16%">기능</Th>
                <Th w="6%">보통</Th>
                <Th w="6%">어려움</Th>
                <Th w="6%">대단함</Th>
                <Th w="13%">피해</Th>
                <Th w="9%">사거리</Th>
                <Th w="8%">공격횟수</Th>
                <Th w="8%">탄약</Th>
                <Th w="8%">고장</Th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {weapons.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-3 py-4 text-center text-xs text-muted-foreground"
                  >
                    아직 등록된 무기가 없습니다.
                  </td>
                </tr>
              ) : (
                weapons.map((w, i) => {
                  const linked = w.skill
                    ? skills.find((s) => s.name === w.skill)
                    : undefined;
                  const total = linked ? skillTotal(linked, characteristics) : null;
                  return (
                  <tr key={i}>
                    <CellInput
                      placeholder="권총"
                      value={w.name}
                      onChange={(v) =>
                        setWeapons((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, name: v } : x)),
                        )
                      }
                    />
                    <CellInput
                      placeholder="사격(권총)"
                      value={w.skill ?? ''}
                      onChange={(v) =>
                        setWeapons((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, skill: v } : x)),
                        )
                      }
                    />
                    <ReadCell value={total != null ? total : '—'} />
                    <ReadCell value={total != null ? Math.floor(total / 2) : '—'} />
                    <ReadCell value={total != null ? Math.floor(total / 5) : '—'} />
                    <CellInput
                      placeholder="1d10"
                      value={w.damage ?? ''}
                      onChange={(v) =>
                        setWeapons((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, damage: v } : x)),
                        )
                      }
                    />
                    <CellInput
                      placeholder="10m"
                      value={w.range ?? ''}
                      onChange={(v) =>
                        setWeapons((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, range: v } : x)),
                        )
                      }
                    />
                    <CellInput
                      placeholder="1"
                      value={w.attacks ?? ''}
                      onChange={(v) =>
                        setWeapons((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, attacks: v } : x)),
                        )
                      }
                    />
                    <CellInput
                      placeholder="9"
                      value={w.ammo ?? ''}
                      onChange={(v) =>
                        setWeapons((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, ammo: v || null } : x,
                          ),
                        )
                      }
                    />
                    <CellInput
                      placeholder="98"
                      value={w.malfunction ?? ''}
                      onChange={(v) =>
                        setWeapons((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, malfunction: v || null } : x,
                          ),
                        )
                      }
                    />
                    <RemoveCellTd
                      onRemove={() => setWeapons((prev) => prev.filter((_, j) => j !== i))}
                    />
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableSection>

        {/* 주문 / 소지품 — 2열 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TableSection
            title="주문 / 마법"
            add={() => setSpells((prev) => [...prev, { name: '', cost: '', effect: '' }])}
          >
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th w="28%">주문</Th>
                  <Th w="22%">소비</Th>
                  <Th>효과</Th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {spells.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-muted-foreground"
                    >
                      주문이 필요한 캐릭터만 채우세요.
                    </td>
                  </tr>
                ) : (
                  spells.map((s, i) => (
                    <tr key={i}>
                      <CellInput
                        placeholder="이름"
                        value={s.name}
                        onChange={(v) =>
                          setSpells((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, name: v } : x)),
                          )
                        }
                      />
                      <CellInput
                        placeholder="5MP, 1d6 SAN"
                        value={s.cost ?? ''}
                        onChange={(v) =>
                          setSpells((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, cost: v } : x)),
                          )
                        }
                      />
                      <CellInput
                        placeholder="효과"
                        value={s.effect ?? ''}
                        onChange={(v) =>
                          setSpells((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, effect: v } : x)),
                          )
                        }
                      />
                      <RemoveCellTd
                        onRemove={() => setSpells((prev) => prev.filter((_, j) => j !== i))}
                      />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableSection>

          <TableSection
            title="소지품"
            add={() => setInventory((prev) => [...prev, { name: '', qty: 1, notes: '' }])}
          >
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th w="42%">품목</Th>
                  <Th w="14%">수량</Th>
                  <Th>비고</Th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-muted-foreground"
                    >
                      아직 비어있습니다.
                    </td>
                  </tr>
                ) : (
                  inventory.map((it, i) => (
                    <tr key={i}>
                      <CellInput
                        placeholder="품목"
                        value={it.name}
                        onChange={(v) =>
                          setInventory((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, name: v } : x)),
                          )
                        }
                      />
                      <td className="p-0">
                        <input
                          type="number"
                          min={1}
                          value={it.qty ?? 1}
                          onChange={(e) =>
                            setInventory((prev) =>
                              prev.map((x, j) =>
                                j === i
                                  ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) }
                                  : x,
                              ),
                            )
                          }
                          className="w-full bg-transparent px-2 py-1.5 text-center text-sm tabular-nums outline-none focus:bg-accent/40"
                        />
                      </td>
                      <CellInput
                        placeholder="비고"
                        value={it.notes ?? ''}
                        onChange={(v) =>
                          setInventory((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, notes: v } : x)),
                          )
                        }
                      />
                      <RemoveCellTd
                        onRemove={() =>
                          setInventory((prev) => prev.filter((_, j) => j !== i))
                        }
                      />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableSection>
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

function StatusToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={[
        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition',
        checked
          ? 'border-destructive/50 bg-destructive/5'
          : 'bg-background hover:bg-accent/40',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <span className={checked ? 'font-medium text-destructive' : ''}>{label}</span>
    </label>
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

/**
 * 시트형 컴팩트 표 섹션. 헤더 + 표 + '추가' 버튼.
 * 행 컴포넌트는 부모가 children 으로 직접 <tr> 들을 넘긴다.
 */
function TableSection({
  title,
  add,
  children,
}: {
  title: string;
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
      <div className="overflow-x-auto rounded-md border">{children}</div>
    </section>
  );
}

function Th({ children, w }: { children: React.ReactNode; w?: string }) {
  return (
    <th
      className="px-3 py-2 text-left font-medium"
      style={w ? { width: w } : undefined}
    >
      {children}
    </th>
  );
}

/** 셀 안의 borderless input — 시트 셀 느낌. Focus 시 옅은 배경. */
function CellInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <td className="p-0">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:bg-accent/40"
      />
    </td>
  );
}

/** 자동 계산된 셀 (보통/어려움/대단함). 입력 불가, tabular. */
function ReadCell({ value }: { value: number | string }) {
  return (
    <td className="bg-muted/20 px-2 py-1.5 text-center text-sm tabular-nums">
      {value}
    </td>
  );
}

function RemoveCellTd({ onRemove }: { onRemove: () => void }) {
  return (
    <td className="w-8 p-0 text-center">
      <button
        type="button"
        onClick={onRemove}
        className="flex h-full w-full items-center justify-center text-muted-foreground hover:text-destructive"
        aria-label="삭제"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </td>
  );
}
