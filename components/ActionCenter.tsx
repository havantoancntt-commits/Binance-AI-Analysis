import React, { useState } from 'react';
import {
  ClipboardIcon,
  CpuChipIcon,
  CheckIcon,
  BinanceIcon,
  ArrowUpRightIcon,
  CheckBadgeIcon,
  XMarkIcon,
} from './Icons';

type ActiveTab = 'support' | 'binance';

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass: string;
}> = ({ active, onClick, children, activeClass }) => (
  <button
    onClick={onClick}
    className={`w-1/2 py-3 text-sm font-bold duration-300 rounded-t-lg focus:outline-none border-b-2
      ${active ? `${activeClass} text-white` : 'border-transparent text-gray-400 hover:text-white'}`}
  >
    {children}
  </button>
);


const SupportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const accountNumber = '0501000160764';
    const accountName = 'HA VAN TOAN';
    const bankName = 'Vietcombank';
    const qrData = `Vietcombank | ${accountName} | ${accountNumber}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&bgcolor=140a0a&color=f97316&qzone=1`;

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up" 
            style={{animationDuration: '0.3s'}}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
        >
            <div 
                className="glassmorphism rounded-xl max-w-lg w-full relative border border-red-500/30" 
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <CpuChipIcon className="w-6 h-6 text-red-400"/>
                        <div>
                            <h3 id="support-modal-title" className="text-lg font-bold text-gray-100">Hỗ trợ dự án</h3>
                            <p className="text-sm text-gray-400">Sự ủng hộ của bạn là động lực để phát triển công cụ này.</p>
                        </div>
                    </div>
                     <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Đóng"
                    >
                        <XMarkIcon className="w-5 h-5"/>
                    </button>
                </header>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-shrink-0 bg-gray-900 p-2 rounded-lg border border-gray-700">
                            <img src={qrCodeUrl} alt="QR Code ủng hộ" width="128" height="128" />
                        </div>
                        <div className="flex-1 space-y-3 text-gray-300 w-full">
                            <div>
                                <span className="text-sm font-semibold text-gray-400">Ngân hàng:</span>
                                <span className="font-bold text-white ml-2">{bankName}</span>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-400">Chủ tài khoản:</span>
                                <span className="font-bold text-white ml-2">{accountName}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-semibold text-gray-400">Số tài khoản:</span>
                                <div className="flex items-center gap-2 bg-gray-800 p-2.5 rounded-lg">
                                    <span className="font-mono text-base text-orange-300 flex-grow">{accountNumber}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                                        title="Sao chép số tài khoản"
                                    >
                                        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                                {copied && <p className="text-green-400 text-xs text-right mt-1">Đã sao chép!</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const BinanceTab: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const referralCode = 'I5ZHQCRB';
    const referralLink = 'https://accounts.binance.com/register?ref=I5ZHQCRB';

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

     const benefits = [
        'Sàn giao dịch uy tín #1 thế giới',
        'Giảm phí giao dịch trọn đời',
        'Bảo mật tài sản hàng đầu',
    ];

    return (
         <div className="p-6 animate-fade-in-up">
             <ul className="space-y-2 mb-6">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{benefit}</span>
                    </li>
                ))}
            </ul>

            <div className="space-y-4">
                 <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-400">Mã mời (ưu đãi độc quyền):</span>
                    <div className="flex items-center gap-2 bg-gray-800 p-2.5 rounded-lg">
                        <span className="font-mono text-base text-yellow-300 flex-grow tracking-wider">{referralCode}</span>
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
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
                    className="w-full flex items-center justify-center gap-2 px-8 py-3 font-bold text-gray-900 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-lg hover:shadow-lg hover:shadow-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-amber-500 transform hover:scale-105"
                >
                    Mở Tài Khoản Ngay <ArrowUpRightIcon className="w-5 h-5" />
                </a>
            </div>
         </div>
    );
};


const ActionCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('binance');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  return (
    <>
        <section className="glassmorphism rounded-lg shadow-2xl interactive-card card-glow-hover">
            <header className="flex items-stretch border-b border-gray-700/50">
                <TabButton 
                    active={activeTab === 'binance'} 
                    onClick={() => setActiveTab('binance')}
                    activeClass="border-yellow-400"
                >
                    <div className="flex items-center justify-center gap-2">
                        <BinanceIcon className="w-5 h-5 text-yellow-400" />
                        <span>Mở Tài khoản Binance</span>
                    </div>
                </TabButton>
                <TabButton 
                    active={false}
                    onClick={() => setIsSupportModalOpen(true)}
                    activeClass="border-red-500"
                >
                    <div className="flex items-center justify-center gap-2">
                        <CpuChipIcon className="w-5 h-5 text-red-400" />
                        <span>Hỗ trợ Dự án</span>
                    </div>
                </TabButton>
            </header>

            <div>
                {activeTab === 'binance' && <BinanceTab />}
            </div>
        </section>

        {isSupportModalOpen && <SupportModal onClose={() => setIsSupportModalOpen(false)} />}
    </>
  );
};

export default React.memo(ActionCenter);
