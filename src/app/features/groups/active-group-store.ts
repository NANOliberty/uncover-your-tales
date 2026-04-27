import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 사용자가 현재 보고 있는 그룹.
 * 멀티 그룹 소속이 가능하므로 사이드바에서 토글한다.
 *
 * 실제 그룹 목록 / 권한은 M1 에서 Supabase 쿼리로 채운다.
 */
interface ActiveGroupState {
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
}

export const useActiveGroupStore = create<ActiveGroupState>()(
  persist(
    (set) => ({
      activeGroupId: null,
      setActiveGroupId: (id) => set({ activeGroupId: id }),
    }),
    {
      name: 'uyt:active-group',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
