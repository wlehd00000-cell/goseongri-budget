# 스마트 이무 대시보드 — 사회혁신학기 2026

경희대학교 고성리 프로젝트를 위한 **실시간 공유 예산 관리 웹앱**입니다.
링크 하나로 접속 → 지출 등록/수정 → 팀원 전원에게 즉시 반영되는 공용 가계부입니다.

> ⚠️ 이 앱은 로그인 없이 누구나 접속·수정할 수 있습니다. 링크는 팀 내부에서만 공유하세요.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 실시간 동기화 | Supabase Realtime — 다른 기기에서 등록한 지출이 즉시 반영 |
| 자동 저장 | 지출 추가·수정·삭제 즉시 DB 저장, 별도 저장 버튼 없음 |
| 구간별 예산 | 제주 1차 / 영암 / 제주 2차(축제) 별 배정·집행 현황 |
| 예산 슬라이더 | 구간별 예산을 5만원 단위로 실시간 조정 |
| 소급정산 | 개인카드 결제 → 인별 미정산 금액 관리 → 정산완료 처리 |
| CSV 내보내기 | 전체 지출 + 요약 + 소급정산 현황 포함 |
| 경고 알림 | 예산 초과/번레이트 초과/미정산 건 자동 감지 |

---

## 기술 스택

- **프레임워크**: Next.js 15 (App Router) + TypeScript
- **스타일**: Tailwind CSS + 인라인 스타일 (Pretendard 폰트)
- **DB / 실시간**: Supabase (PostgreSQL + Realtime)
- **차트**: Recharts
- **배포**: Vercel

---

## 로컬 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (아래 참고)
cp .env.example .env.local
# .env.local 파일 편집

# 3. 개발 서버 실행
npm run dev
# http://localhost:3000 접속
```

---

## 환경변수 설정

`.env.local` 파일을 만들고 아래 값을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

Supabase 대시보드 → **Project Settings → API** 에서 확인할 수 있습니다.

---

## Supabase 설정 방법

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. **SQL Editor** 열기
3. `supabase/schema.sql` 전체 내용 붙여넣기 후 실행
4. 테이블 생성 + RLS 정책 + Realtime 활성화 + 초기 데이터가 한 번에 적용됩니다

```sql
-- 필요 테이블
-- expenses      : 지출 내역
-- budget_config : 구간별 예산 배정 (단일 행)
```

---

## 자동 저장 / 자동 동기화 동작 방식

- **자동 저장**: 지출 등록·수정·삭제·상태 변경 시 즉시 Supabase에 저장됩니다.
  저장 중 / 완료 / 실패 상태가 헤더 우상단에 표시됩니다.

- **자동 동기화**: Supabase Realtime Postgres Changes를 구독합니다.
  다른 기기에서 데이터가 변경되면 3초 이내에 현재 화면에 반영됩니다.
  연결이 끊기면 자동으로 재연결을 시도합니다.

- **변경 알림**: 다른 사용자가 데이터를 변경했을 때 헤더에 노란 토스트가 3초간 표시됩니다.

---

## 공개 링크 사용 시 운영 주의사항

- 로그인이 없으므로 **링크를 아는 누구나 데이터를 수정**할 수 있습니다.
- 팀 외부에 링크를 공유하지 마세요.
- 잘못 수정된 경우 헤더의 "↺ 초기화" 버튼으로 샘플 데이터로 복원할 수 있습니다.
- 중요한 시점마다 CSV 백업을 받아두세요.

---

## Vercel 배포 방법

```bash
# 방법 1: Vercel CLI
npm i -g vercel
vercel --prod

# 방법 2: GitHub 연동 (권장)
# 1. GitHub에 push
# 2. vercel.com → Import Project → GitHub 저장소 선택
# 3. 환경변수 입력 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
# 4. Deploy
```

---

## GitHub 업로드 방법

```bash
cd goseongri-budget
git init
git add .
git commit -m "초기 배포: 스마트 이무 대시보드 v3.1"
git remote add origin https://github.com/YOUR_USERNAME/goseongri-budget.git
git push -u origin main
```

---

## 폴더 구조

```
src/
├── app/
│   ├── layout.tsx       # HTML 레이아웃, 메타데이터
│   ├── page.tsx         # 메인 페이지 (대시보드 마운트)
│   └── globals.css      # 전역 스타일
├── components/
│   ├── BudgetDashboard.tsx  # 메인 대시보드 (헤더, KPI, 탭 컨트롤)
│   ├── OverviewTab.tsx      # 총괄 현황 탭
│   ├── SegmentsTab.tsx      # 구간별·예산 조정 탭
│   ├── ListTab.tsx          # 지출 내역 탭
│   ├── ReimburseTab.tsx     # 소급정산 탭
│   └── ui.tsx               # 공통 UI 컴포넌트 (Card, Badge, ProgressBar 등)
├── hooks/
│   └── useSupabaseData.ts   # Supabase CRUD + Realtime 훅
├── lib/
│   ├── supabase.ts          # Supabase 클라이언트 + 타입 정의
│   ├── constants.ts         # 상수 (예산, 구간, 색상, 포맷 함수)
│   └── computeStats.ts      # 통계 계산 (useMemo에서 사용)
└── types/
    └── stats.ts             # Stats 타입 정의
supabase/
└── schema.sql               # DB 스키마 + RLS + seed 데이터
```

---

## 백업/복구 방법

- **CSV 내보내기**: 헤더 우상단 "📥 CSV" 버튼으로 언제든 내보낼 수 있습니다.
- **초기화**: 헤더 "↺ 초기화" 버튼으로 샘플 5건 + 기본 예산으로 복원됩니다.
- **SQL 복원**: Supabase SQL Editor에서 `supabase/schema.sql`을 재실행하면 전체 초기화됩니다.

---

## 이후 유지보수 방법

- 지출 항목 추가/변경: `src/lib/constants.ts`의 `CATEGORIES` 배열 수정
- 팀 변경: `src/lib/constants.ts`의 `TEAMS` 배열 수정
- 예산 총액 변경: `src/lib/constants.ts`의 `TOTAL_BUDGET` 수정
- 재배포: `git push` 후 Vercel이 자동으로 재배포합니다.
