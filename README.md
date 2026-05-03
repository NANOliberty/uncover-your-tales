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

### 1. 프론트엔드

```bash
npm install
npm run dev
```

### 2. 백엔드 (Supabase 로컬)

Docker 만 있으면 됩니다 (`npx supabase` 로 CLI 실행).

```bash
# 로컬 Postgres + Auth + Storage + Studio 기동
npx supabase start

# 출력된 키 / API URL 을 .env.local 에 채워 넣기
cp .env.example .env.local
# VITE_SUPABASE_URL          ← Project URL
# VITE_SUPABASE_ANON_KEY     ← Publishable key (sb_publishable_...)
```

`supabase start` 가 처음 실행될 때 `supabase/migrations/*.sql` 이 자동 적용됩니다.

기동 후 접속 정보:
- Studio (DB GUI): http://127.0.0.1:54323
- Mailpit (이메일 캡처): http://127.0.0.1:54324
- API: http://127.0.0.1:54321

스키마를 바꿨을 때:

```bash
# 마이그레이션을 새 파일로 추가 (예: 0002_xxx.sql) 한 뒤
supabase db reset            # 로컬 DB 를 처음부터 다시 만들기
# 그리고 타입 재생성
supabase gen types typescript --local > src/app/lib/supabase/database.types.ts
```

### 3. OAuth (Discord / Google)

로컬에서 OAuth 로그인까지 테스트하려면 `.env.local` 에 다음을 추가:

```
SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID=...
SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET=...
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
```

각 provider 의 redirect URI 는 `http://127.0.0.1:54321/auth/v1/callback` 입니다.

## 폴더 구조

```
src/app/
  features/      # 기능 단위 (auth, groups, characters, scenarios, ...)
  layout/        # 글로벌 레이아웃 (헤더, 사이드바, 그룹 스위처)
  pages/         # 라우트 매핑되는 페이지 컴포넌트
  lib/           # supabase 클라이언트, CoC 룰 헬퍼, 코코포리아 export 등
  components/ui/ # shadcn primitives (수정 자제)

supabase/
  config.toml          # supabase start 설정
  migrations/*.sql     # 스키마 마이그레이션 (시간순)
  seed.sql             # 로컬 시드 데이터
```

## 진행 상황

- [x] M0 — 프로젝트 정리, 라우팅 스켈레톤
- [ ] M1 — 인증 + 그룹 (진행 중)
  - [x] M1.1 — 스키마 기초 (profiles / groups / group_members + RLS)
  - [ ] M1.2 — Discord / Google OAuth UI
  - [ ] M1.3 — `/g/{slug}` 라우팅 + 그룹 스위처 실데이터
  - [ ] M1.4 — 그룹 생성 + 초대 코드/링크
- [ ] M2 — 캐릭터 시트 (CoC 7판)
- [ ] M3 — 시나리오 / SessionRun
- [ ] M4 — 구인구직 + 일정 매칭
- [ ] M5 — 세션 로그 자동 정리
- [x] M6 — 캐릭터 관계 맵
- [ ] M7 — 외부 연동 (Discord 웹훅, Google Calendar, 트위터)
- [ ] M8 — 시스템 확장 (D&D 5e, 던전월드, 커스텀 빌더)
- [ ] M9 — 커뮤니티, 알림, 검색, 디자인 패스
