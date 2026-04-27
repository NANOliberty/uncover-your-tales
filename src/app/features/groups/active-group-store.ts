import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 사용자가 마지막으로 본 그룹의 slug.
 *
 * - URL `/g/:slug` 와 1:1.
 * - 멀티 그룹 소속에서 "다음에 들어왔을 때 어디로 보낼지" 결정에 사용.
 * - 권위(authoritative) 는 항상 URL — 이 스토어는 캐시일 뿐이다.
 *   스토어 값이 더 이상 멤버십이 없는 그룹이면 무시되고 정리된다.
 */
interface ActiveGroupState {
  activeSlug: string | null;
  setActiveSlug: (slug: string | null) => void;
}

export const useActiveGroupStore = create<ActiveGroupState>()(
  persist(
    (set) => ({
      activeSlug: null,
      setActiveSlug: (slug) => set({ activeSlug: slug }),
    }),
    {
      name: 'uyt:active-group',
      version: 2,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * 이전 버전(v1) 에서는 `activeGroupId` 를 썼다 — 사용처가 있다면 deprecated 별칭으로 유지.
 * 새 코드는 `activeSlug` 를 쓴다.
 */
export const useActiveGroupSlug = () => useActiveGroupStore((s) => s.activeSlug);
