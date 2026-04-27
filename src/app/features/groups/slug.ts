/**
 * 그룹 슬러그 정규화.
 * 마이그레이션의 CHECK 제약과 동일한 규칙: ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$
 *
 * 사용자가 그룹 이름을 타이핑하는 동안 실시간으로 슬러그 후보를 만들어
 * 폼의 보조 입력에 표시한다.
 */
export function suggestSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 40);
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}
