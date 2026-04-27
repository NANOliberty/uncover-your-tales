# Uncover Your Tales (UYT)

> 우리 그룹의 TRPG 아카이브 + 캐릭터 도감 + 일정 매칭기

`Uncover Your ___` 시리즈의 TRPG 편. 가려져 있던 캠페인과 캐릭터의 이야기를 드러냅니다.

## 핵심 가치

1. **자동계산 캐릭터 시트** — CoC 7판부터 (코코포리아 채팅팔레트 export 포함)
2. **시나리오 / SessionRun 분리 모델** — 같은 시나리오를 여러 번 굴려도 각각 독립 기록
3. **세션 로그 자동 정리** — 코코포리아·디스코드 로그 붙여넣기 → 정규화
4. **캐릭터 관계 맵 시각화** — 그룹 단위 세계관 지도, 시점 토글

## 운영 모델

친구 그룹 중심의 폐쇄 커뮤니티 (Invite-only). 모든 콘텐츠는 그룹에 속합니다.

## Tech Stack

- **Frontend**: Vite + React 18 + Tailwind v4 + shadcn/Radix + react-router 7
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + RLS)
- **State**: TanStack Query + Zustand
- **Forms**: react-hook-form + zod
- **Graph**: React Flow (캐릭터 관계 맵)

## 개발

```bash
npm install
npm run dev
```

환경 변수는 `.env.example`을 복사해 `.env.local`로 사용하세요.

## 폴더 구조

```
src/app/
  features/      # 기능 단위 (auth, groups, characters, scenarios, ...)
  layout/        # 글로벌 레이아웃 (헤더, 사이드바, 그룹 스위처)
  pages/         # 라우트 매핑되는 페이지 컴포넌트
  lib/           # supabase 클라이언트, CoC 룰 헬퍼, 코코포리아 export 등
  components/ui/ # shadcn primitives (수정 자제)
```
