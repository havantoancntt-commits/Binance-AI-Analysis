
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
  ClipboardIcon,
  CpuChipIcon,
  CheckIcon,
  BinanceIcon,
  ArrowUpRightIcon,
  CheckBadgeIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from './Icons';

const SupportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4 animate-fade-in-up" 
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
                            <h3 id="support-modal-title" className="text-lg font-bold text-gray-100">{t('actionCenter.support.modal.title')}</h3>
                            <p className="text-sm text-gray-400">{t('actionCenter.support.modal.subtitle')}</p>
                        </div>
                    </div>
                     <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label={t('actionCenter.support.modal.close')}
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
                                <span className="text-sm font-semibold text-gray-400">{t('actionCenter.support.bank')}</span>
                                <span className="font-bold text-white ml-2">{bankName}</span>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-400">{t('actionCenter.support.accountName')}</span>
                                <span className="font-bold text-white ml-2">{accountName}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-semibold text-gray-400">{t('actionCenter.support.accountNumber')}</span>
                                <div className="flex items-center gap-2 bg-gray-800 p-2.5 rounded-lg">
                                    <span className="font-mono text-base text-orange-300 flex-grow">{accountNumber}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                                        title={t('actionCenter.support.copyTitle')}
                                    >
                                        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                                {copied && <p className="text-green-400 text-xs text-right mt-1">{t('actionCenter.support.copied')}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActionCenter: React.FC = () => {
  const { t, locale, setLocale } = useTranslation();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
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
      t('actionCenter.binance.benefit1'),
      t('actionCenter.binance.benefit2'),
      t('actionCenter.binance.benefit3'),
  ];

  return (
    <>
      <section className="glassmorphism rounded-lg p-6 space-y-6 h-full flex flex-col justify-between">
        {/* Binance Referral */}
        <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-400/10 rounded-full border border-yellow-500/30">
                    <BinanceIcon className="w-8 h-8 text-yellow-400"/>
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                        {t('actionCenter.binance.title')}
                    </h3>
                    <p className="text-sm text-gray-400">{t('actionCenter.binance.subtitle')}</p>
                </div>
            </div>
            <ul className="space-y-2 my-4">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <CheckBadgeIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{benefit}</span>
                    </li>
                ))}
            </ul>
             <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-400">{t('actionCenter.binance.referralCode')}</span>
                <div className="flex items-center gap-2 bg-gray-800 p-2.5 rounded-lg">
                    <span className="font-mono text-base text-yellow-300 flex-grow tracking-wider">{referralCode}</span>
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                        title={t('actionCenter.binance.copyTitle')}
                    >
                        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                    </button>
                </div>
                 {copied && <p className="text-green-400 text-xs text-right mt-1">{t('actionCenter.binance.copied')}</p>}
            </div>
             <a
                href={referralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 px-8 py-3 font-bold text-gray-900 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-lg hover:shadow-lg hover:shadow-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-amber-500 transform hover:scale-105"
            >
                {t('actionCenter.binance.button')} <ArrowUpRightIcon className="w-5 h-5" />
            </a>
        </div>
        
        {/* Support & Settings */}
        <div className="border-t border-gray-700/50 pt-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button onClick={() => setIsSupportModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-red-400 transition-colors">
                <CpuChipIcon className="w-5 h-5"/>
                {t('actionCenter.tabs.support')}
            </button>

            <div className="flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5 text-gray-400"/>
                <div className="flex space-x-1 bg-gray-800 p-1 rounded-md">
                    <button
                        onClick={() => setLocale('vi')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${locale === 'vi' ? 'bg-red-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                        VN
                    </button>
                    <button
                        onClick={() => setLocale('en')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${locale === 'en' ? 'bg-red-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                        EN
                    </button>
                </div>
            </div>
        </div>
      </section>

      {isSupportModalOpen && <SupportModal onClose={() => setIsSupportModalOpen(false)} />}
    </>
  );
};

export default React.memo(ActionCenter);