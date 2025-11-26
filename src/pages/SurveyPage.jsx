import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { options } from '../static/questions';
import { supabase } from '../lib/supabaseClient';

const SurveyPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [textQuestions, setTextQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from('questions').select('*').eq('is_active', true).order('order_index', { ascending: true });

      if (error) throw error;

      const ratingQuestions = data.filter((q) => q.question_type === 'rating');
      const textQuestionsData = data.filter((q) => q.question_type === 'text');

      setQuestions(ratingQuestions);
      setTextQuestions(textQuestionsData);

      // 초기 surveyData 설정
      const initialData = {};
      [...ratingQuestions, ...textQuestionsData].forEach((q) => {
        initialData[q.id] = '';
      });
      setSurveyData(initialData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('질문을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (questionId, value) => {
    setSurveyData((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const submittedAt = new Date().toISOString();
      const responses = [];

      [...questions, ...textQuestions].forEach((question) => {
        const responseValue = surveyData[question.id];
        if (responseValue && responseValue.trim() !== '') {
          responses.push({
            question_id: question.id,
            response_value: responseValue,
            submitted_at: submittedAt,
          });
        }
      });

      const { error } = await supabase.from('responses').insert(responses);

      if (error) throw error;

      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError('설문 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    const allQuestions = [...questions, ...textQuestions];
    return allQuestions.every((question) => {
      const answer = surveyData[question.id];
      return answer && answer.trim() !== '';
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">질문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length + textQuestions.length;
  const answeredQuestions = Object.values(surveyData).filter((val) => val && val.trim() !== '').length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">펄스체크</h1>
          <p className="text-lg text-gray-600">이번 주 팀의 상태를 확인합니다</p>
          <p className="text-sm text-gray-500 mt-2">모든 응답은 익명으로 처리됩니다</p>
        </div>

        {/* 진행률 바 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-medium text-blue-600">
              {answeredQuestions}/{totalQuestions}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* 질문 카드 */}
        <div className="space-y-6">
          {/* Rating 질문들 */}
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pt-0.5">{question.question_text}</h3>
              </div>

              <div className="grid grid-cols-1 gap-2 ml-11">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      surveyData[question.id] === option.value
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.value}
                      checked={surveyData[question.id] === option.value}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={`ml-3 font-medium ${surveyData[question.id] === option.value ? 'text-blue-900' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Text 질문들 */}
          {textQuestions.map((textQuestion, index) => (
            <div key={textQuestion.id} className="bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {questions.length + index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pt-0.5">{textQuestion.question_text}</h3>
              </div>

              <textarea
                value={surveyData[textQuestion.id] || ''}
                onChange={(e) => handleInputChange(textQuestion.id, e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                rows="4"
                placeholder="자유롭게 의견을 작성해주세요..."
              />
            </div>
          ))}
        </div>

        {/* 제출 버튼 */}
        <div className="mt-10 text-center">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className={`px-10 py-4 rounded-xl font-bold text-lg transition-all transform ${
              isFormValid() && !submitting
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                제출 중...
              </span>
            ) : (
              '제출하기'
            )}
          </button>

          <p className="text-sm text-gray-500 mt-4">제출하시면 익명으로 저장됩니다</p>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
