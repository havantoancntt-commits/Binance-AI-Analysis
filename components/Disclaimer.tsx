import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

const Disclaimer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black/50 backdrop-blur-sm border-t border-gray-700/50 text-gray-400 px-4 py-2 text-xs z-50">
      <div className="max-w-8xl mx-auto flex items-center justify-center text-center gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 text-yellow-500" />
        <div>
          <strong className="font-bold text-yellow-400">Miễn trừ trách nhiệm:</strong>
          <span className="ml-1">
              Thông tin được cung cấp bởi ứng dụng này chỉ dành cho mục đích thông tin và không phải là lời khuyên tài chính. Giao dịch tiền điện tử có rủi ro cao. Hãy tự nghiên cứu trước khi đưa ra quyết định đầu tư.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Disclaimer;