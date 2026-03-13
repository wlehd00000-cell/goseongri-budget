-- ============================================================
-- 사회혁신학기 2026 - 스마트 이무 대시보드
-- Supabase PostgreSQL Schema + Seed Data
-- ============================================================

-- expenses 테이블
CREATE TABLE IF NOT EXISTS expenses (
  id          BIGSERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  category    TEXT NOT NULL,
  team        TEXT NOT NULL,
  segment     TEXT NOT NULL CHECK (segment IN ('jeju1','yeongam','jeju2')),
  status      TEXT NOT NULL DEFAULT '실제' CHECK (status IN ('실제','예정')),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  memo        TEXT DEFAULT '',
  reimburse   BOOLEAN DEFAULT FALSE,
  paid_by     TEXT DEFAULT '',
  reimbursed  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- budget_config 테이블 (단일 행)
CREATE TABLE IF NOT EXISTS budget_config (
  id          BIGSERIAL PRIMARY KEY,
  reserve     INTEGER NOT NULL DEFAULT 6300000,
  jeju1       INTEGER NOT NULL DEFAULT 5355000,
  yeongam     INTEGER NOT NULL DEFAULT 17850000,
  jeju2       INTEGER NOT NULL DEFAULT 12495000,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- expenses 트리거
DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- budget_config 트리거
DROP TRIGGER IF EXISTS budget_config_updated_at ON budget_config;
CREATE TRIGGER budget_config_updated_at
  BEFORE UPDATE ON budget_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화 (공개 앱이므로 anon 키로 모든 작업 허용)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_config ENABLE ROW LEVEL SECURITY;

-- expenses 정책 (누구나 읽기/쓰기 가능 - 내부 팀 공유 앱)
DROP POLICY IF EXISTS "public_all_expenses" ON expenses;
CREATE POLICY "public_all_expenses" ON expenses
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- budget_config 정책
DROP POLICY IF EXISTS "public_all_budget_config" ON budget_config;
CREATE POLICY "public_all_budget_config" ON budget_config
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_config;

-- ============================================================
-- Seed Data (초기 샘플 데이터)
-- ============================================================

-- budget_config 초기값
INSERT INTO budget_config (reserve, jeju1, yeongam, jeju2)
VALUES (6300000, 5355000, 17850000, 12495000)
ON CONFLICT DO NOTHING;

-- 샘플 지출 데이터
INSERT INTO expenses (date, category, team, segment, status, amount, memo, reimburse, paid_by, reimbursed)
VALUES
  ('2026-03-15', '교통비', '공통', 'jeju1', '실제', 420000, '제주행 항공권 (3인)', FALSE, '', FALSE),
  ('2026-03-16', '식비', '조리팀', 'jeju1', '실제', 185000, '고성리 오일장 식재료 구매', TRUE, '김민서', FALSE),
  ('2026-06-10', '재료비', '조리팀', 'jeju2', '예정', 750000, '마을 바다황 쿠킹클래스 재료비', FALSE, '', FALSE),
  ('2026-06-12', '디자인·제작', '디자인팀', 'jeju2', '예정', 320000, 'PoC 팸플릿 파넬디자인·리플렛 제작', FALSE, '', FALSE),
  ('2026-03-17', '운영비', '영상팀', 'jeju1', '실제', 89000, 'SD카드 및 보조배터리 구매 (개인카드)', TRUE, '이지현', TRUE)
ON CONFLICT DO NOTHING;
