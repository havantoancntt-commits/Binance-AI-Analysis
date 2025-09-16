
import React, { useState } from 'react';
import { BinanceIcon, ClipboardIcon, CheckIcon, ArrowUpRightIcon } from './Icons';

const BinanceReferral: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const referralCode = 'I5ZHQCRB';
  const referralLink = 'https://accounts.binance.com/register?ref=I5ZHQCRB';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="glassmorphism p-6 rounded-lg shadow-2xl animate-fade-in h-full flex flex-col justify-between border border-amber-500/20 hover:border-amber-500/50 transition-all">
      <div>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-400/10 rounded-full">
                <BinanceIcon className="w-8 h-8 text-yellow-400"/>
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-200">Mở Khoá Giao Dịch Chuyên Nghiệp</h3>
                <p className="text-sm text-gray-400">Đăng ký tài khoản trên sàn giao dịch #1 thế giới.</p>
            </div>
        </div>
        <div className="space-y-4 my-6">
            <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-400">Mã mời (Ref ID):</span>
                <div className="flex items-center gap-2 bg-gray-800 p-2.5 rounded-lg">
                  <span className="font-mono text-lg text-yellow-300 flex-grow">{referralCode}</span>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                    title="Sao chép mã mời"
                  >
                    {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                  </button>
                </div>
                {copied && <p className="text-green-400 text-xs text-right mt-1">Đã sao chép!</p>}
            </div>

            <a
                href={referralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-8 py-3 font-bold text-white bg-gradient-to-r from-yellow-600 to-amber-500 rounded-lg hover:from-yellow-500 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-amber-500 transition-all duration-300"
            >
                Đăng ký Ngay <ArrowUpRightIcon className="w-5 h-5" />
            </a>
        </div>
      </div>
    </section>
  );
};

export default React.memo(BinanceReferral);
