import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type { GroupRow, TrpgSystem } from '../lib/supabase/database.types';
import { useCreateCharacter } from '../features/characters/mutations';
import { COC_GRID_ORDER, COC_LABELS } from '../lib/coc/characteristics';
import { calculateDerived } from '../lib/coc/derived';
import { emptyCoCData, type CoCCharacteristic, type CoCCharacteristics } from '../lib/coc/types';

interface GroupOutletContext {
  group: GroupRow;
}

const SYSTEM_OPTIONS: { value: TrpgSystem; label: string; available: boolean }[] = [
  { value: 'coc7', label: 'CoC 7판', available: true },
  { value: 'dnd5e', label: 'D&D 5e', available: false },
  { value: 'dungeon_world', label: '던전월드', available: false },
  { value: 'custom', label: '커스텀', available: false },
];

interface FieldErrors {
  name?: string;
  characteristics?: string;
}

export function CharacterNewPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const navigate = useNavigate();
  const create = useCreateCharacter();

  const [system, setSystem] = useState<TrpgSystem>('coc7');
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [residence, setResidence] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [characteristics, setCharacteristics] = useState<CoCCharacteristics>(
    emptyCoCData().characteristics,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const derived = useMemo(
    () => calculateDerived(characteristics, age === '' ? null : age),
    [characteristics, age],
  );

  const setStat = (k: CoCCharacteristic, raw: string) => {
    const n = raw === '' ? 0 : Math.max(0, Math.min(99, Number(raw) || 0));
    setCharacteristics((prev) => ({ ...prev, [k]: n }));
    if (errors.characteristics) setErrors((s) => ({ ...s, characteristics: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!name.trim()) next.name = '이름을 입력하세요';
    if (Object.values(characteristics).some((v) => v < 1 || v > 99)) {
      next.characteristics = '능력치는 1~99 사이여야 합니다';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const data =
        system === 'coc7'
          ? {
              ...emptyCoCData(),
              info: {
                age: age === '' ? null : age,
                gender: gender || null,
                residence: residence || null,
                birthplace: birthplace || null,
              },
              characteristics,
            }
          : {};

      const created = await create.mutateAsync({
        groupId: group.id,
        system,
        name: name.trim(),
        occupation: occupation.trim() || null,
        data,
      });
      toast.success(`"${created.name}" 캐릭터가 만들어졌어요`);
      navigate(`/g/${group.slug}/characters/${created.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[create-character] failed:', err);
      const e = (err ?? {}) as { message?: string; code?: string };
      const msg = e.message || (err instanceof Error ? err.message : '알 수 없는 오류');
      toast.error(`생성 실패: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{group.is_solo ? '내 작업실' : group.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">새 캐릭터</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          능력치를 입력하면 HP·MP·이성·이동력 등이 자동 계산됩니다.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* 시스템 */}
        <section>
          <Label className="mb-2 block">시스템</Label>
          <div className="flex flex-wrap gap-2">
            {SYSTEM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={!opt.available}
                onClick={() => setSystem(opt.value)}
                className={[
                  'rounded-full border px-3 py-1.5 text-sm transition',
                  system === opt.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground',
                  !opt.available && 'cursor-not-allowed opacity-50',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {opt.label}
                {!opt.available && ' (준비중)'}
              </button>
            ))}
          </div>
        </section>

        {/* 기본 정보 */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium">기본 정보</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((s) => ({ ...s, name: undefined }));
                }}
                maxLength={100}
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occupation">직업</Label>
              <Input
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="예: 사립 탐정, 고서점 점원"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">나이</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) =>
                  setAge(e.target.value === '' ? '' : Math.max(1, Math.min(120, Number(e.target.value) || 0)))
                }
                placeholder="이동력 계산에 사용"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">성별</Label>
              <Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="residence">거주지</Label>
              <Input
                id="residence"
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthplace">출신지</Label>
              <Input
                id="birthplace"
                value={birthplace}
                onChange={(e) => setBirthplace(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 능력치 */}
        <section>
          <h2 className="mb-2 text-sm font-medium">능력치</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            1~99 사이로 입력하세요. STR/DEX/CON/APP/POW = 3d6×5, SIZ/INT/EDU = (2d6+6)×5, LUCK = 3d6×5 굴림이 표준입니다.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COC_GRID_ORDER.map((key) => (
              <CharacteristicInput
                key={key}
                code={key}
                value={characteristics[key]}
                onChange={(v) => setStat(key, v)}
              />
            ))}
          </div>
          {errors.characteristics && (
            <p className="mt-2 text-xs text-destructive">{errors.characteristics}</p>
          )}
        </section>

        {/* 파생값 미리보기 */}
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">자동 계산</h2>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
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

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '만드는 중…' : '캐릭터 만들기'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CharacteristicInput({
  code,
  value,
  onChange,
}: {
  code: CoCCharacteristic;
  value: number;
  onChange: (v: string) => void;
}) {
  const label = COC_LABELS[code];
  return (
    <label className="flex flex-col gap-1 rounded-md border bg-card px-3 py-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {code} · {label.ko}
      </span>
      <input
        type="number"
        min={1}
        max={99}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-2xl font-medium tabular-nums outline-none"
      />
      <span className="text-[10px] text-muted-foreground">
        / 2 = {Math.floor(value / 2)} · / 5 = {Math.floor(value / 5)}
      </span>
    </label>
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
