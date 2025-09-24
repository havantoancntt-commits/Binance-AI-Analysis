import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { 
    Squares2X2Icon, XMarkIcon, Cog6ToothIcon, BinanceIcon, ArrowUpRightIcon, 
    CheckBadgeIcon, ClipboardIcon, CheckIcon, CpuChipIcon, ArchiveBoxXMarkIcon 
} from './Icons';
import DelistingWatchlist from './DelistingWatchlist';


// Internal Component: BinanceReferral
const BinanceReferral: React.FC = () => {
  const { t } = useTranslation();
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
    t('binance.benefit1'),
    t('binance.benefit2'),
    t('binance.benefit3'),
  ];

  return (
    <section className="glassmorphism p-6 rounded-lg h-full flex flex-col justify-between border border-yellow-500/40 bg-gradient-to-br from-yellow-500/5 to-transparent shadow-[0_0_15px_rgba(234,179,8,0.2)]">
      <div>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-400/10 rounded-full border border-yellow-500/30">
                <BinanceIcon className="w-8 h-8 text-yellow-400"/>
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                    {t('binance.title')}
                </h3>
                <p className="text-sm text-gray-400">{t('binance.subtitle')}</p>
            </div>
        </div>
        <ul className="space-y-2 my-6">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckBadgeIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300 text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-4">
            <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-400">{t('binance.referralCode')}</span>
                <div className="flex items-center gap-2 bg-gray-800 p-2.5 rounded-lg">
                  <span className="font-mono text-lg text-yellow-300 flex-grow tracking-wider">{referralCode}</span>
                  <button onClick={handleCopy} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white" title={t('binance.copyTitle')}>
                    {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                  </button>
                </div>
                {copied && <p className="text-green-400 text-xs text-right mt-1">{t('binance.copied')}</p>}
            </div>
            <a href={referralLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-8 py-3 font-bold text-gray-900 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-lg hover:shadow-lg hover:shadow-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background-rgb))] focus:ring-amber-500 transition-all duration-300 transform hover:scale-105">
                {t('binance.button')} <ArrowUpRightIcon className="w-5 h-5" />
            </a>
        </div>
      </div>
    </section>
  );
};

// Internal Component: SupportProject
const SupportProject: React.FC = () => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
  
    const accountNumber = '0501000160764';
    const accountName = 'HA VAN TOAN';
    const bankName = 'Vietcombank';
    const qrData = `Vietcombank | ${accountName} | ${accountNumber}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&bgcolor=14101a&color=8b5cf6&qzone=1`;
  
    const handleCopy = () => {
      navigator.clipboard.writeText(accountNumber).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
  
    return (
      <section className="glassmorphism p-6 rounded-lg h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
              <CpuChipIcon className="w-8 h-8 text-violet-400"/>
              <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-200">{t('support.title')}</h3>
                  <p className="text-sm text-gray-400">{t('support.subtitle')}</p>
              </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 bg-gray-900 p-2 rounded-lg border border-gray-700">
                  <img src={qrCodeUrl} alt={t('support.qrAlt')} width="150" height="150" />
              </div>
              <div className="flex-1 space-y-3 text-gray-300 w-full">
                <div>
                  <span className="text-sm font-semibold text-gray-400">{t('support.bank')}</span>
                  <span className="font-bold text-white ml-2">{bankName}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-400">{t('support.accountName')}</span>
                  <span className="font-bold text-white ml-2">{accountName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-gray-400">{t('support.accountNumber')}</span>
                  <div className="flex items-center gap-2 bg-gray-800 p-2.5 rounded-lg">
                    <span className="font-mono text-lg text-teal-300 flex-grow">{accountNumber}</span>
                    <button onClick={handleCopy} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white" title={t('support.copyTitle')}>
                      {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {copied && <p className="text-green-400 text-xs text-right mt-1">{t('support.copied')}</p>}
                </div>
              </div>
          </div>
        </div>
      </section>
    );
};

type ActiveModal = 'main' | 'delisting' | null;

const FloatingActionMenu: React.FC = () => {
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const { t, locale, setLocale } = useTranslation();

    const closeModal = () => setActiveModal(null);

    const renderModalContent = () => {
        switch (activeModal) {
            case 'delisting':
                return <DelistingWatchlist />;
            case 'main':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <BinanceReferral />
                        <SupportProject />
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <>
            <div className="fixed bottom-6 left-6 z-[100]">
                <button
                    onClick={() => setActiveModal('main')}
                    className="p-4 bg-gradient-to-r from-teal-500 to-violet-600 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background-rgb))] focus:ring-teal-400 transition-all duration-200 animate-pulse-shadow"
                    aria-label={t('utilities.menu.label')}
                >
                    <Squares2X2Icon className="w-8 h-8" />
                </button>
            </div>
            
            {activeModal && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[101] flex items-center justify-center p-4 animate-fade-in-up" 
                    style={{animationDuration: '0.4s'}}
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="utilities-modal-title"
                >
                    <div 
                        className="glassmorphism aurora-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="p-4 border-b border-[var(--border-color)] flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <Squares2X2Icon className="w-6 h-6 text-teal-300"/>
                                <h3 id="utilities-modal-title" className="text-lg font-bold text-gray-100">{t('utilities.title')}</h3>
                            </div>
                            <button onClick={closeModal} className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white" aria-label={t('utilities.close')}>
                                <XMarkIcon className="w-6 h-6"/>
                            </button>
                        </header>
                        
                        <main className="p-6 overflow-y-auto flex-grow no-scrollbar">
                             {renderModalContent()}
                        </main>

                         <footer className="p-4 border-t border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
                            {/* Delisting Watchlist Button */}
                            <button 
                                onClick={() => setActiveModal(activeModal === 'delisting' ? 'main' : 'delisting')} 
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors duration-200 ${activeModal === 'delisting' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700/80'}`}
                            >
                                <ArchiveBoxXMarkIcon className="w-5 h-5" />
                                {t('delisting.menuButton')}
                            </button>

                            {/* Language Switcher */}
                            <div className="flex items-center gap-2">
                                <Cog6ToothIcon className="w-5 h-5 text-gray-400"/>
                                <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg border border-[var(--border-color)]">
                                    <button
                                        onClick={() => setLocale('vi')}
                                        className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${locale === 'vi' ? 'bg-gradient-to-r from-teal-500 to-violet-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                                    >
                                        VN
                                    </button>
                                    <button
                                        onClick={() => setLocale('en')}
                                        className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${locale === 'en' ? 'bg-gradient-to-r from-teal-500 to-violet-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                                    >
                                        EN
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingActionMenu;