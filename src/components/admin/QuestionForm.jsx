import React, { useState, useEffect } from 'react';

const QuestionForm = ({ question, onSave, onCancel, nextOrderIndex }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'rating',
    order_index: nextOrderIndex || 1,
    is_active: true,
    is_optional: false,
  });

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text,
        question_type: question.question_type,
        order_index: question.order_index,
        is_active: question.is_active,
        is_optional: question.is_optional,
      });
    } else {
      setFormData({
        question_text: '',
        question_type: 'rating',
        order_index: nextOrderIndex || 1,
        is_active: true,
        is_optional: false,
      });
    }
  }, [question, nextOrderIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{question ? '질문 수정' : '새 질문 추가'}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 질문 텍스트 */}
        <div>
          <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-1">
            질문 내용 *
          </label>
          <textarea
            id="question_text"
            required
            value={formData.question_text}
            onChange={(e) => handleChange('question_text', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="질문을 입력하세요..."
          />
        </div>

        {/* 질문 유형 */}
        <div>
          <label htmlFor="question_type" className="block text-sm font-medium text-gray-700 mb-1">
            질문 유형 *
          </label>
          <select
            id="question_type"
            required
            value={formData.question_type}
            onChange={(e) => handleChange('question_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">1-5점 평가 (Rating)</option>
            <option value="text">주관식 (Text)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Rating: 1-5점 척도로 평가 / Text: 자유 응답 텍스트</p>
        </div>

        {/* 순서 */}
        <div>
          <label htmlFor="order_index" className="block text-sm font-medium text-gray-700 mb-1">
            순서 *
          </label>
          <input
            id="order_index"
            type="number"
            required
            min="1"
            value={formData.order_index}
            onChange={(e) => handleChange('order_index', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">질문이 표시되는 순서를 지정합니다. 낮은 숫자가 먼저 표시됩니다.</p>
        </div>

        {/* 활성화 여부 */}
        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            활성화 (체크 해제 시 설문에 표시되지 않음)
          </label>
        </div>

        {/* 옵셔널 여부 */}
        <div className="flex items-center">
          <input
            id="is_optional"
            type="checkbox"
            checked={formData.is_optional}
            onChange={(e) => handleChange('is_optional', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_optional" className="ml-2 block text-sm text-gray-700">
            옵셔널 (체크 시 선택사항)
          </label>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium">
            {question ? '수정 저장' : '질문 추가'}
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium">
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
