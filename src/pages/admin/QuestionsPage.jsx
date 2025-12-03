import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminAuth, signOut } from '../../hooks/useAdminAuth';
import QuestionList from '../../components/admin/QuestionList';
import QuestionForm from '../../components/admin/QuestionForm';

const QuestionsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, user } = useAdminAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
      return;
    }

    if (!authLoading && isAdmin) {
      fetchQuestions();
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.from('questions').select('*').order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('질문 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      setError(null);

      if (editingQuestion) {
        // 수정
        const { error: updateError } = await supabase
          .from('questions')
          .update({
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            order_index: questionData.order_index,
            is_active: questionData.is_active,
            is_optional: questionData.is_optional,
          })
          .eq('id', editingQuestion.id);

        if (updateError) throw updateError;
      } else {
        // 새로 추가
        const { error: insertError } = await supabase.from('questions').insert([questionData]);

        if (insertError) throw insertError;
      }

      // 목록 새로고침
      await fetchQuestions();

      // 폼 닫기
      setShowForm(false);
      setEditingQuestion(null);
    } catch (err) {
      console.error('Error saving question:', err);
      setError('질문 저장 중 오류가 발생했습니다.');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowForm(true);
    setScrollTop();
  };

  const setScrollTop = () => {
    window.scrollTo({ top: 0 });
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('정말로 이 질문을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase.from('questions').delete().eq('id', questionId);

      if (deleteError) throw deleteError;

      // 목록 새로고침
      await fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('질문 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (questionId, isActive) => {
    try {
      setError(null);

      const { error: updateError } = await supabase.from('questions').update({ is_active: !isActive }).eq('id', questionId);

      if (updateError) throw updateError;

      // 목록 새로고침
      await fetchQuestions();
    } catch (err) {
      console.error('Error toggling question active status:', err);
      setError('질문 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleReorder = async (reorderedQuestions) => {
    try {
      setError(null);

      // 순서 업데이트
      const updates = reorderedQuestions.map((q, index) => ({
        id: q.id,
        order_index: index + 1,
      }));

      for (const update of updates) {
        const { error: updateError } = await supabase.from('questions').update({ order_index: update.order_index }).eq('id', update.id);

        if (updateError) throw updateError;
      }

      // 목록 새로고침
      await fetchQuestions();
    } catch (err) {
      console.error('Error reordering questions:', err);
      setError('질문 순서 변경 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">질문 관리</h1>
              <p className="text-sm text-gray-500 mt-1">Pulse Check 설문 질문 관리</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => navigate('/results')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                결과 보기
              </button>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 질문 추가 버튼 */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">총 {questions.length}개의 질문</p>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            {showForm ? '취소' : '+ 새 질문 추가'}
          </button>
        </div>

        {/* 질문 폼 */}
        {showForm && (
          <div className="mb-6">
            <QuestionForm
              question={editingQuestion}
              onSave={handleSaveQuestion}
              onCancel={() => {
                setShowForm(false);
                setEditingQuestion(null);
              }}
              nextOrderIndex={questions.length + 1}
            />
          </div>
        )}

        {/* 질문 목록 */}
        <QuestionList
          questions={questions}
          onEdit={handleEditQuestion}
          onDelete={handleDeleteQuestion}
          onToggleActive={handleToggleActive}
          onReorder={handleReorder}
        />
      </main>
    </div>
  );
};

export default QuestionsPage;
