import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { 
    BinanceIcon, ArrowUpRightIcon, CheckBadgeIcon, 
    ClipboardIcon, CheckIcon 
} from './Icons';

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

export default BinanceReferral;