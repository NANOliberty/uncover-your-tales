import type { RelationKind } from '../../lib/supabase/database.types';

/** 관계 종류 → 화면 표현 매핑. 하나의 진실 원본. */
export const RELATION_STYLES: Record<
  RelationKind,
  { label: string; color: string; bg: string; border: string }
> = {
  positive: {
    label: '우정·애정',
    color: '#e11d48', // rose-600
    bg: '#ffe4e6',
    border: '#fb7185',
  },
  negative: {
    label: '적대·라이벌',
    color: '#b91c1c', // red-700
    bg: '#fee2e2',
    border: '#ef4444',
  },
  neutral: {
    label: '지인·중립',
    color: '#525252', // neutral-600
    bg: '#f5f5f5',
    border: '#a3a3a3',
  },
  bond: {
    label: '인연·맹세',
    color: '#7c3aed', // violet-600
    bg: '#ede9fe',
    border: '#a78bfa',
  },
  mystery: {
    label: '수상·미지',
    color: '#b45309', // amber-700
    bg: '#fef3c7',
    border: '#f59e0b',
  },
};

export const RELATION_KINDS: RelationKind[] = [
  'positive',
  'bond',
  'neutral',
  'mystery',
  'negative',
];

/** 자주 쓰는 라벨 — 입력 보조용 datalist */
export const COMMON_LABELS_BY_KIND: Record<RelationKind, string[]> = {
  positive: ['친구', '동료', '연인', '존경', '신뢰'],
  negative: ['라이벌', '적', '증오', '경멸', '배신'],
  neutral: ['지인', '아는 사이', '거래처'],
  bond: ['가족', '연인', '맹세', '계약', '주종'],
  mystery: ['수상함', '의심', '미지', '경계'],
};
