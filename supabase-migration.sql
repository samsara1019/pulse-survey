-- Pulse Check 앱 데이터베이스 마이그레이션
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. questions 테이블 생성 (동적 질문 관리)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('rating', 'text')),
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. admins 테이블 생성 (관리자 권한 관리)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. pulse_surveys 테이블 수정 (submitted_at 컬럼 추가)
-- 기존 테이블에 submitted_at 컬럼이 없다면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pulse_surveys' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE pulse_surveys ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 기존 데이터의 submitted_at을 created_at으로 채우기
UPDATE pulse_surveys
SET submitted_at = created_at
WHERE submitted_at IS NULL;

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- questions 테이블 정책
-- 관리자는 모든 작업 가능
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 인증된 사용자는 활성화된 질문만 읽기 가능
DROP POLICY IF EXISTS "Authenticated users can read active questions" ON questions;
CREATE POLICY "Authenticated users can read active questions" ON questions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- admins 테이블 정책
-- 관리자만 admins 테이블 읽기 가능
DROP POLICY IF EXISTS "Admins can read admins" ON admins;
CREATE POLICY "Admins can read admins" ON admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 5. 기존 정적 질문 데이터를 questions 테이블에 삽입
INSERT INTO questions (question_text, question_type, order_index, is_active) VALUES
  ('[USA 전체] 이번 주, 조직의 목표와 방향이 명확하게 전달되었다.', 'rating', 1, true),
  ('[USA 전체] 이번 주, 내 의견이 팀이나 조직에 반영된다고 느꼈다.', 'rating', 2, true),
  ('[USA 전체] 이번 주의 업무량은 부담스럽지 않고 관리 가능했다.', 'rating', 3, true),
  ('[USA 전체] 이번 주, 동료들과 협력하며 연결감을 느꼈다.', 'rating', 4, true),
  ('[USA 전체] 리더가 나의 성장과 목표 달성을 적극적으로 지원한다고 느꼈다.', 'rating', 5, true),
  ('[USA Front] 이번 주, 우리는 서로의 강점을 잘 활용해 협업했다.', 'rating', 6, true),
  ('[USA Front] 이번 주, 팀 안에서 의견을 자유롭게 말할 수 있었다.', 'rating', 7, true),
  ('[USA Front] 이번 주, 팀 내 기대치와 책임이 명확하게 전달되었다.', 'rating', 8, true),
  ('[USA Front] 이번 주, 문제를 서로 탓하지 않고 함께 해결하려고 했다.', 'rating', 9, true),
  ('[USA Front] 이번 주, 리더와의 1:1 대화나 체크인 시간이 충분했다.', 'rating', 10, true),
  ('팀에서 ''이건 정말 잘하고 있다''고 느끼는 부분이 있다면 적어주세요.', 'text', 11, true),
  ('업무를 하며 ''이 기능/프로세스만 추가되면 정말 좋겠다''고 느낀 점이 있다면 적어주세요.', 'text', 12, true)
ON CONFLICT DO NOTHING;

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_pulse_surveys_submitted_at ON pulse_surveys(submitted_at);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 7. 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- questions 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 첫 번째 관리자 추가 (본인 이메일로 변경하세요)
-- 주의: 먼저 Supabase Auth에서 회원가입을 한 후, 해당 이메일을 여기에 입력하세요
-- INSERT INTO admins (user_id, email)
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com'
-- ON CONFLICT DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Sign up in Supabase Auth if you haven''t already';
  RAISE NOTICE '2. Uncomment and run the last INSERT statement with your email to add yourself as admin';
END $$;
