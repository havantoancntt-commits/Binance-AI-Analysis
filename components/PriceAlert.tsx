import React, { useState } from 'react';
import { ClipboardIcon, HeartIcon } from './Icons';

const DonationCallout: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const accountNumber = '0501000160764';
  const accountName = 'HA VAN TOAN';
  const bankName = 'Vietcombank';
  const qrData = `Vietcombank | ${accountName} | ${accountNumber}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&bgcolor=161B22&color=e5e7eb&qzone=1`;

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="glassmorphism rounded-lg overflow-hidden animate-fade-in h-full flex flex-col">
      <div className="p-6 text-center">
        <HeartIcon className="w-12 h-12 mx-auto text-pink-400 mb-3" />
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-400">
          Nếu bạn thấy hữu ích...
        </h3>
        <p className="mt-2 text-gray-300">
          Công cụ này được phát triển và duy trì bởi một cá nhân. Sự ủng hộ của bạn sẽ là nguồn động viên lớn để tôi tiếp tục cải thiện và thêm nhiều tính năng mới.
        </p>
      </div>
      <div className="bg-gray-900/50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 flex-grow">
        <div className="flex-1 space-y-4 text-gray-300 w-full">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-400">Ngân hàng:</span>
            <span className="font-bold text-white">{bankName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-400">Chủ tài khoản:</span>
            <span className="font-bold text-white">{accountName}</span>
          </div>
          <div className="space-y-2">
            <span className="font-semibold text-gray-400">Số tài khoản:</span>
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg">
              <span className="font-mono text-xl text-cyan-300 flex-grow">{accountNumber}</span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                title="Sao chép số tài khoản"
              >
                <ClipboardIcon className="w-5 h-5" />
              </button>
            </div>
            {copied && <p className="text-green-400 text-xs text-right">Đã sao chép!</p>}
          </div>
        </div>
        <div className="flex-shrink-0 bg-gray-900 p-2 rounded-lg border border-gray-700">
          <img src={qrCodeUrl} alt="QR Code ủng hộ" width="180" height="180" />
        </div>
      </div>
    </section>
  );
};

export default React.memo(DonationCallout);
