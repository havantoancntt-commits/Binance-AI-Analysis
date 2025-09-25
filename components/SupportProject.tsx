import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ClipboardIcon, CheckIcon, CpuChipIcon } from './Icons';

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

export default SupportProject;