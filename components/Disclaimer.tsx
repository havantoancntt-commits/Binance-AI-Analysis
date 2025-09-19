
import React from 'react';
import { ExclamationTriangleIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

const Disclaimer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black/50 backdrop-blur-sm border-t border-gray-700/50 text-gray-400 px-4 py-2 text-xs z-50">
      <div className="max-w-8xl mx-auto flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-2">
        <ExclamationTriangleIcon className="w-8 h-8 sm:w-5 sm:h-5 flex-shrink-0 text-yellow-500" />
        <div>
          <strong className="font-bold text-yellow-400">{t('disclaimer.title')}</strong>
          <span className="ml-1">
              {t('disclaimer.text')}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Disclaimer);