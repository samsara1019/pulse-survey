import React from 'react';

const QuestionItem = ({
  question,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg shadow p-4 transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
      } cursor-move`}
    >
      <div className="flex items-start gap-4">
        {/* 드래그 핸들 */}
        <div className="flex-shrink-0 mt-1">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>

        {/* 질문 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  #{question.order_index}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    question.question_type === 'rating'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {question.question_type === 'rating' ? '1-5점 평가' : '주관식'}
                </span>
                {!question.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    비활성
                  </span>
                )}
              </div>

              <p className="text-gray-900 mb-2">{question.question_text}</p>

              <div className="text-xs text-gray-500">
                생성: {new Date(question.created_at).toLocaleDateString('ko-KR')}
                {question.updated_at !== question.created_at && (
                  <span className="ml-2">
                    수정: {new Date(question.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {/* 활성화/비활성화 토글 */}
              <button
                onClick={() => onToggleActive(question.id, question.is_active)}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  question.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={question.is_active ? '비활성화' : '활성화'}
              >
                {question.is_active ? '활성' : '비활성'}
              </button>

              {/* 수정 버튼 */}
              <button
                onClick={() => onEdit(question)}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              >
                수정
              </button>

              {/* 삭제 버튼 */}
              <button
                onClick={() => onDelete(question.id)}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionItem;
