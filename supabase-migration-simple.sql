-- 간단한 응답 테이블 마이그레이션
-- questions 테이블은 이미 있고, 응답만 저장하면 됨

-- 1. responses 테이블 생성
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  response_value TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted ON responses(submitted_at);

-- 3. RLS 정책
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- 누구나 응답 추가 가능
DROP POLICY IF EXISTS "Anyone can insert responses" ON responses;
CREATE POLICY "Anyone can insert responses" ON responses
  FOR INSERT
  WITH CHECK (true);

-- 관리자만 응답 읽기 가능
DROP POLICY IF EXISTS "Admins can read responses" ON responses;
CREATE POLICY "Admins can read responses" ON responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 완료
DO $$
BEGIN
  RAISE NOTICE 'Simple responses table created successfully!';
  RAISE NOTICE 'Structure: question_id + response_value + submitted_at';
END $$;
