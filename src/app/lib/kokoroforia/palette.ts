/**
 * 코코포리아 채팅팔레트 export — CoC 7e.
 *
 * 코코포리아는 일본/한국 TRPG 커뮤니티에서 널리 쓰이는 온라인 세션 도구.
 * 각 줄이 다이스 명령 또는 채팅 매크로로 동작하며, 사용자는 클릭 한 번에
 * 미리 작성한 굴림을 채팅에 보낸다.
 *
 * 사용 형식:
 *   CC<={N} {라벨}        — d100 굴림, CoC 7e 성공/실패 자동 판정
 *   1d{N} {라벨}           — 단순 d{N} 굴림
 *   1d{X}+1d{Y} {라벨}    — 합산 굴림
 *
 * 결과를 클립보드 → 코코포리아 캐릭터 시트의 채팅팔레트 칸에 붙여넣어 사용.
 */

import { COC_LABELS, COC_GRID_ORDER } from '../coc/characteristics';
import { calculateDerived, maxSanity } from '../coc/derived';
import { skillTotal } from '../coc/skill-calc';
import type { CoCData } from '../coc/types';

interface GenerateOptions {
  characterName: string;
  data: CoCData;
}

export function generateKokoroforiaPalette({
  characterName,
  data,
}: GenerateOptions): string {
  const c = data.characteristics;
  const derived = calculateDerived(c, data.info?.age ?? null);
  const mythosSkill = data.skills.find((s) => s.key === 'cthulhu_mythos');
  const mythosTotal = mythosSkill ? skillTotal(mythosSkill, c) : 0;
  const sanCap = maxSanity(mythosTotal);
  const currentSan = data.currentSan ?? Math.min(derived.san, sanCap);
  const currentHp = data.currentHp ?? derived.hp;
  const currentMp = data.currentMp ?? derived.mp;

  const lines: string[] = [];
  const section = (title: string) => {
    if (lines.length > 0) lines.push('');
    lines.push(`// ${title}`);
  };

  // 헤더
  lines.push(`// === ${characterName} ===`);
  lines.push(`// 체력 ${currentHp}/${derived.hp}  |  마력 ${currentMp}/${derived.mp}  |  이성 ${currentSan}/${sanCap}`);
  if (derived.damageBonus !== '0') {
    lines.push(`// 피해 보너스 ${derived.damageBonus}  |  체구 ${derived.build}  |  이동력 ${derived.mov}`);
  } else {
    lines.push(`// 체구 ${derived.build}  |  이동력 ${derived.mov}`);
  }

  // 능력치 굴림
  section('능력치');
  for (const k of COC_GRID_ORDER) {
    const v = c[k];
    if (v <= 0) continue;
    lines.push(`CC<=${v} ${COC_LABELS[k].ko} (${k})`);
  }

  // 기능 — 합계가 의미 있는 것만 (분배 있거나 능력치 파생)
  section('기능');
  const sortedSkills = [...data.skills].sort((a, b) => {
    const ta = skillTotal(a, c);
    const tb = skillTotal(b, c);
    return tb - ta;
  });
  for (const s of sortedSkills) {
    const total = skillTotal(s, c);
    // 분배가 0 이고 base 와 동일한 표준 기술 중 의미가 약한 것 (1, 5 등) 은 스킵
    // 단 회피·모국어 같은 능력치 파생, 그리고 분배된 기술은 모두 포함
    const allocated = (s.occupation || 0) + (s.interest || 0) > 0;
    if (!allocated && total <= 5) continue;
    lines.push(`CC<=${total} ${s.name}`);
  }

  // 무기 피해
  if (data.weapons && data.weapons.length > 0) {
    section('무기');
    const skillByName = new Map(data.skills.map((s) => [s.name, s]));
    for (const w of data.weapons) {
      if (!w.name?.trim()) continue;
      // 명중 굴림 — 사용 기능과 매칭되면
      const linked = w.skill ? skillByName.get(w.skill) : undefined;
      if (linked) {
        const total = skillTotal(linked, c);
        lines.push(`CC<=${total} ${w.name} 명중 (${w.skill})`);
      }
      // 피해 굴림 — {DB} placeholder 를 실제 DB 값으로 치환
      if (w.damage) {
        const damage = expandDamage(w.damage, derived.damageBonus);
        lines.push(`${damage} ${w.name} 피해`);
      }
    }
  }

  // 주문
  if (data.spells && data.spells.length > 0) {
    section('주문');
    for (const s of data.spells) {
      if (!s.name?.trim()) continue;
      const cost = s.cost ? ` (${s.cost})` : '';
      lines.push(`// ${s.name}${cost}`);
    }
  }

  // 이성·광기 굴림
  section('이성·광기');
  lines.push(`CC<=${currentSan} 이성 굴림`);
  lines.push(`1d3 SAN 손실 (소)`);
  lines.push(`1d6 SAN 손실 (중)`);
  lines.push(`1d10 SAN 손실 (대)`);
  lines.push(`1d100 비전투 광기 표`);
  lines.push(`1d10 전투 광기 표`);

  // 행운
  section('행운·기타');
  lines.push(`CC<=${c.LUCK} 행운`);
  lines.push(`1d100 일반 d100`);
  lines.push(`1d6 일반 d6`);
  lines.push(`1d4 일반 d4`);

  return lines.join('\n');
}

/**
 * 무기 피해 표현식의 {DB} 또는 +DB / +db 를 실제 피해 보너스로 치환.
 * 예: "1d10+{DB}" + DB="+1d4" → "1d10+1d4"
 *      "1d4+DB"  + DB="-1"   → "1d4-1"
 *      "1d10"   + DB="+1d4" → "1d10" (DB 표기 없으면 그대로)
 */
function expandDamage(formula: string, db: string): string {
  // 정규화: db 가 "0" 또는 "+0" 이면 추가 안 함, "+1d4" 식이면 그대로 붙이기
  const dbClean = db.startsWith('+') || db.startsWith('-') ? db : `+${db}`;
  const dbNoZero = dbClean === '+0' ? '' : dbClean;

  // {DB} placeholder
  if (/\{DB\}/i.test(formula)) {
    return formula.replace(/\+?\{DB\}/gi, dbNoZero);
  }
  // 끝에 +DB / +db 있는 경우
  if (/\+DB\b/i.test(formula)) {
    return formula.replace(/\+DB\b/i, dbNoZero);
  }
  return formula;
}
