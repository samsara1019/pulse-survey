import React from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYouPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* 체크 아이콘 */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* 메시지 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            설문 제출 완료!
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            소중한 의견 감사드립니다.
          </p>
          <p className="text-gray-600 mb-8">
            한 주 동안 고생하셨습니다. 여러분의 피드백은 팀을 더 나은 방향으로 이끄는 데 큰 도움이 됩니다.
          </p>

          {/* 정보 박스 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              제출하신 응답은 익명으로 처리되며, 팀 리더와 관리자만 집계된 결과를 확인할 수 있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
            >
              메인으로 돌아가기
            </button>
            <button
              onClick={() => navigate('/survey')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors duration-200"
            >
              다시 응답하기
            </button>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            궁금한 사항이 있으시면 팀 리더에게 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
