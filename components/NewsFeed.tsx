import React from 'react';
import type { NewsArticle } from '../types';
import { NewspaperIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

const formatTimeAgo = (timestamp: number, locale: 'vi' | 'en') => {
  const now = new Date();
  const past = new Date(timestamp * 1000);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) {
      return locale === 'vi' ? 'vài giây trước' : 'a few seconds ago';
  }

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  const translations = {
    en: { year: 'year', month: 'month', day: 'day', hour: 'hour', minute: 'minute' },
    vi: { year: 'năm', month: 'tháng', day: 'ngày', hour: 'giờ', minute: 'phút' },
  };

  for (const intervalName in intervals) {
    const intervalValue = intervals[intervalName];
    if (seconds >= intervalValue) {
      const counter = Math.floor(seconds / intervalValue);
      const singular = translations[locale][intervalName as keyof typeof translations.en];
      if (locale === 'en') {
          return `${counter} ${singular}${counter !== 1 ? 's' : ''} ago`;
      }
      return `${counter} ${singular} trước`;
    }
  }
  return '';
};

const NewsSkeleton: React.FC = () => (
    <div className="bg-gray-900/50 rounded-lg p-4 shimmer-bg">
        <div className="flex items-start space-x-4">
            <div className="rounded-md bg-gray-700 h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0"></div>
            <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
            </div>
        </div>
    </div>
);

interface NewsFeedProps {
  news: NewsArticle[];
  isLoading: boolean;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading }) => {
  const { t, locale } = useTranslation();
  return (
    <section className="glassmorphism aurora-card p-6 rounded-xl h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <NewspaperIcon className="w-6 h-6 text-teal-400"/>
            <h3 className="text-xl font-bold text-gray-200">{t('news.title')}</h3>
        </div>
      <div className="overflow-y-auto pr-2 space-y-4 flex-grow no-scrollbar">
        {isLoading ? (
          <>
            <NewsSkeleton />
            <NewsSkeleton />
            <NewsSkeleton />
          </>
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>{t('news.empty')}</p>
          </div>
        ) : (
          news.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-900/50 hover:bg-gray-900/80 p-4 rounded-lg transition-colors duration-300 group"
            >
              <div className="flex items-start gap-4">
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md flex-shrink-0 border border-gray-700" 
                />
                <div className="flex flex-col flex-1">
                  <h4 className="text-sm sm:text-md font-bold text-gray-100 group-hover:text-teal-400 transition-colors">
                    {article.title}
                  </h4>
                  <div className="flex-grow"></div>
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <span>{article.source}</span>
                    <span className="mx-2">•</span>
                    <span>{formatTimeAgo(article.publishedOn, locale)}</span>
                  </div>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
};

export default React.memo(NewsFeed);