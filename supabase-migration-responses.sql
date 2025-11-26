-- 동적 질문 응답 시스템 마이그레이션
-- 이 스크립트는 기존 pulse_surveys 테이블 대신 정규화된 응답 테이블을 생성합니다

-- 1. survey_sessions 테이블 생성 (각 설문 제출 세션)
CREATE TABLE IF NOT EXISTS survey_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. survey_responses 테이블 생성 (각 질문에 대한 개별 응답)
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES survey_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  response_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_survey_responses_session ON survey_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question ON survey_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_submitted ON survey_sessions(submitted_at);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 응답 추가 가능
DROP POLICY IF EXISTS "Anyone can insert survey sessions" ON survey_sessions;
CREATE POLICY "Anyone can insert survey sessions" ON survey_sessions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert responses" ON survey_responses;
CREATE POLICY "Anyone can insert responses" ON survey_responses
  FOR INSERT
  WITH CHECK (true);

-- 관리자는 모든 응답 읽기 가능
DROP POLICY IF EXISTS "Admins can read all sessions" ON survey_sessions;
CREATE POLICY "Admins can read all sessions" ON survey_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can read all responses" ON survey_responses;
CREATE POLICY "Admins can read all responses" ON survey_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 5. 기존 pulse_surveys 데이터를 새 테이블로 마이그레이션 (선택사항)
-- 주의: 이 부분은 기존 데이터가 있고, questions 테이블에 해당 질문들이 있을 때만 실행하세요

-- 마이그레이션 함수 (필요시 수동 실행)
CREATE OR REPLACE FUNCTION migrate_pulse_surveys_to_new_structure()
RETURNS void AS $$
DECLARE
  survey_record RECORD;
  new_session_id UUID;
  question_record RECORD;
  question_index INTEGER;
BEGIN
  -- 기존 pulse_surveys의 각 레코드를 순회
  FOR survey_record IN SELECT * FROM pulse_surveys ORDER BY created_at LOOP
    -- 새 세션 생성
    INSERT INTO survey_sessions (submitted_at, created_at)
    VALUES (
      COALESCE(survey_record.submitted_at, survey_record.created_at),
      survey_record.created_at
    )
    RETURNING id INTO new_session_id;

    -- rating 질문들 (q1~q10)
    question_index := 1;
    FOR question_record IN
      SELECT * FROM questions
      WHERE question_type = 'rating'
      ORDER BY order_index
      LOOP

      -- 해당 질문의 응답이 있으면 저장
      IF question_index = 1 AND survey_record.q1 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q1::TEXT);
      ELSIF question_index = 2 AND survey_record.q2 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q2::TEXT);
      ELSIF question_index = 3 AND survey_record.q3 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q3::TEXT);
      ELSIF question_index = 4 AND survey_record.q4 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q4::TEXT);
      ELSIF question_index = 5 AND survey_record.q5 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q5::TEXT);
      ELSIF question_index = 6 AND survey_record.q6 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q6::TEXT);
      ELSIF question_index = 7 AND survey_record.q7 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q7::TEXT);
      ELSIF question_index = 8 AND survey_record.q8 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q8::TEXT);
      ELSIF question_index = 9 AND survey_record.q9 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q9::TEXT);
      ELSIF question_index = 10 AND survey_record.q10 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.q10::TEXT);
      END IF;

      question_index := question_index + 1;
    END LOOP;

    -- text 질문들 (comment1, comment2)
    question_index := 1;
    FOR question_record IN
      SELECT * FROM questions
      WHERE question_type = 'text'
      ORDER BY order_index
      LOOP

      IF question_index = 1 AND survey_record.comment1 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.comment1);
      ELSIF question_index = 2 AND survey_record.comment2 IS NOT NULL THEN
        INSERT INTO survey_responses (session_id, question_id, response_value)
        VALUES (new_session_id, question_record.id, survey_record.comment2);
      END IF;

      question_index := question_index + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Migration completed successfully!';
END;
$$ LANGUAGE plpgsql;

-- 마이그레이션 실행 (주석 해제하여 실행)
-- SELECT migrate_pulse_surveys_to_new_structure();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'New response tables created successfully!';
  RAISE NOTICE 'Tables created: survey_sessions, survey_responses';
  RAISE NOTICE 'To migrate existing data, uncomment and run: SELECT migrate_pulse_surveys_to_new_structure();';
END $$;
