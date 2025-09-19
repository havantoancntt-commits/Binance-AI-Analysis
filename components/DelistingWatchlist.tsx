import React from 'react';
import type { DelistingCoin } from '../types';
import { ArchiveBoxXMarkIcon, ArrowPathIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface DelistingWatchlistProps {
  watchlist: DelistingCoin[];
  isLoading: boolean;
  onRefresh: () => void;
}

const WatchlistSkeleton: React.FC = () => (
    <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <div className="space-y-2">
                    <div className="h-5 w-24 bg-gray-700 rounded"></div>
                    <div className="h-4 w-48 bg-gray-700 rounded"></div>
                </div>
                <div className="h-5 w-28 bg-gray-700 rounded"></div>
            </div>
        ))}
    </div>
);

const DelistingWatchlist: React.FC<DelistingWatchlistProps> = ({ watchlist, isLoading, onRefresh }) => {
  const { t } = useTranslation();
  return (
    <section className="glassmorphism p-6 rounded-lg shadow-2xl animate-fade-in">
        <header className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <ArchiveBoxXMarkIcon className="w-6 h-6 text-orange-400"/>
                <h3 className="text-xl font-bold text-gray-200">{t('delisting.title')}</h3>
            </div>
            <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                aria-label={t('delisting.refresh')}
            >
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
        </header>
        <p className="text-xs text-gray-500 mb-4 -mt-2">
            {t('delisting.subtitle')}
        </p>

      <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3">
        {isLoading ? (
            <WatchlistSkeleton />
        ) : watchlist.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-500">
            {t('delisting.empty')}
          </div>
        ) : (
          watchlist.map((item, index) => (
            <div key={index} className="flex justify-between items-center gap-4 bg-gray-900/50 p-3 rounded-lg border border-transparent hover:border-red-500/50 hover:bg-red-900/20 transition-colors">
              <div>
                <p className="font-bold text-base sm:text-lg text-white">{item.coinPair}</p>
                <p className="text-xs text-gray-400 truncate" title={item.reason}>{item.reason}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-orange-300">{t('delisting.date')} {item.delistingDate}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default React.memo(DelistingWatchlist);