import React, { useState } from 'react';
import QuestionItem from './QuestionItem';

const QuestionList = ({ questions, onEdit, onDelete, onToggleActive, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...questions];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);

    // 순서 업데이트
    const updated = reordered.map((q, idx) => ({
      ...q,
      order_index: idx + 1,
    }));

    setDraggedIndex(index);
    onReorder(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">등록된 질문이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">
          위의 "새 질문 추가" 버튼을 클릭하여 질문을 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          드래그 앤 드롭으로 질문 순서를 변경할 수 있습니다.
        </p>
      </div>

      {questions.map((question, index) => (
        <QuestionItem
          key={question.id}
          question={question}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          isDragging={draggedIndex === index}
        />
      ))}
    </div>
  );
};

export default QuestionList;
