import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { formatWeekLabel, parseDate } from '../utils/dateUtils';

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, questionId, trends }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data[questionId];
    const trend = trends?.[questionId];
    const count = data.count;

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-1">{data.week}</p>
        <p className="text-sm text-gray-700">
          평균: <span className="font-medium">{value?.toFixed(1)}점</span>
        </p>
        {trend && (
          <p
            className={`text-sm flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            <span>
              {trend.change > 0 ? '+' : ''}
              {trend.change} ({trend.changePercentage})
            </span>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">응답: {count}명</p>
      </div>
    );
  }
  return null;
};

const ResultsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [historicalData, setHistoricalData] = useState([]);
  const [textResponses, setTextResponses] = useState({});
  const [questions, setQuestions] = useState([]);
  const [textQuestions, setTextQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 주차별 데이터 처리
  const processWeeklyData = (responses, ratingQuestions) => {
    const weeklyGroups = {};

    // submitted_at 기준으로 그룹화
    responses.forEach((response) => {
      const date = parseDate(response.submitted_at);
      if (!date) return;

      const weekLabel = formatWeekLabel(date);
      const submittedAt = response.submitted_at;

      if (!weeklyGroups[weekLabel]) {
        weeklyGroups[weekLabel] = {
          week: weekLabel,
          date: date,
          submissions: {},
        };
      }

      // 같은 submitted_at끼리 그룹화 (같은 사람의 응답)
      if (!weeklyGroups[weekLabel].submissions[submittedAt]) {
        weeklyGroups[weekLabel].submissions[submittedAt] = {};
      }

      weeklyGroups[weekLabel].submissions[submittedAt][response.question_id] = response.response_value;
    });

    // 주차별 평균 계산
    const weeklyData = Object.values(weeklyGroups)
      .map((weekData) => {
        const submissions = Object.values(weekData.submissions);
        const count = submissions.length;
        if (count === 0) return null;

        const avgData = {
          week: weekData.week,
          date: weekData.date,
          count,
          created_at: weekData.date.toISOString(),
        };

        // 각 rating 질문의 평균
        ratingQuestions.forEach((question) => {
          const values = submissions.map((sub) => parseFloat(sub[question.id])).filter((v) => !isNaN(v));

          if (values.length > 0) {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            avgData[question.id] = parseFloat(avg.toFixed(1));
          } else {
            avgData[question.id] = null;
          }
        });

        return avgData;
      })
      .filter((d) => d !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return addTrendIndicators(weeklyData, ratingQuestions);
  };

  // 전주 대비 변화량
  const addTrendIndicators = (data, ratingQuestions) => {
    return data.map((item, index) => {
      if (index === 0) {
        return { ...item, trends: {} };
      }

      const previous = data[index - 1];
      const trends = {};

      ratingQuestions.forEach((question) => {
        const current = item[question.id];
        const prev = previous[question.id];

        if (current !== null && prev !== null && !isNaN(current) && !isNaN(prev)) {
          const change = current - prev;
          const changePercentage = prev !== 0 ? ((change / prev) * 100).toFixed(1) : '0.0';

          trends[question.id] = {
            change: change.toFixed(2),
            changePercentage: `${change > 0 ? '+' : ''}${changePercentage}%`,
            direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable',
          };
        }
      });

      return { ...item, trends };
    });
  };

  // 데이터 가져오기
  const fetchQuestions = async () => {
    const { data, error } = await supabase.from('questions').select('*').eq('is_active', true).order('order_index', { ascending: true });
    if (error) throw error;

    const ratingQuestions = data.filter((q) => q.question_type === 'rating');
    const textQuestionsData = data.filter((q) => q.question_type === 'text');

    setQuestions(ratingQuestions);
    setTextQuestions(textQuestionsData);

    return { ratingQuestions, textQuestionsData };
  };

  const getHistoricalData = async (ratingQuestions) => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .in(
        'question_id',
        ratingQuestions.map((q) => q.id),
      )
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return processWeeklyData(data, ratingQuestions);
  };

  const getTextResponses = async (textQuestionsData) => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .in(
        'question_id',
        textQuestionsData.map((q) => q.id),
      )
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // 질문별 그룹화
    const grouped = {};
    textQuestionsData.forEach((q) => {
      grouped[q.id] = [];
    });

    data.forEach((response) => {
      if (grouped[response.question_id]) {
        grouped[response.question_id].push({
          response: response.response_value,
          created_at: response.submitted_at,
        });
      }
    });

    return grouped;
  };

  const convertDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = date.getMonth() + 1;
    const week = Math.ceil((date.getDate() + (date.getDay() === 0 ? 7 : date.getDay())) / 7);
    return `${year}년 ${month}월 ${week}주차`;
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
      return;
    }

    if (!authLoading && isAdmin) {
      fetchData();
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { ratingQuestions, textQuestionsData } = await fetchQuestions();
      const [historicalData, textResponsesData] = await Promise.all([getHistoricalData(ratingQuestions), getTextResponses(textQuestionsData)]);

      setHistoricalData(historicalData);
      setTextResponses(textResponsesData);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">팀 펄스체크 결과</h2>
          <p className="text-gray-600">주차별 추이와 팀원들의 의견을 확인하세요</p>
        </div>

        {/* 그래프 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">주차별 우리팀의 추이</h3>

          {historicalData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">아직 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {questions.map((question) => {
                const latestData = historicalData[historicalData.length - 1];
                const trend = latestData?.trends?.[question.id];

                return (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-600 flex-1">{question.question_text}</h4>
                      {trend && (
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            trend.direction === 'up'
                              ? 'bg-green-100 text-green-700'
                              : trend.direction === 'down'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                          <span>{trend.changePercentage}</span>
                        </div>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" fontSize={10} />
                        <YAxis domain={[1, 5]} fontSize={10} />
                        <Tooltip content={<CustomTooltip questionId={question.id} trends={latestData?.trends} />} />
                        <Line
                          type="monotone"
                          dataKey={question.id}
                          stroke="#3B82F6"
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', r: 4 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 의견 */}
        {textQuestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">팀원들의 의견</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {textQuestions.map((textQuestion) => (
                <div key={textQuestion.id}>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">{textQuestion.question_text}</h4>
                  <div className="space-y-3">
                    {textResponses[textQuestion.id]?.length > 0 ? (
                      textResponses[textQuestion.id].map((item, idx) => (
                        <div key={idx} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <p className="text-sm text-gray-700">{item.response}</p>
                          <p className="text-xs text-gray-500 mt-1">{convertDate(item.created_at)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">아직 의견이 없습니다.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/survey')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            설문 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
