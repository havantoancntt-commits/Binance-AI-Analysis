
import React from 'react';
import type { NewsArticle } from '../types';
import { NewspaperIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

const formatTimeAgo = (timestamp: number, locale: 'vi' | 'en') => {
  const now = new Date();
  const past = new Date(timestamp * 1000);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  let counter;

  if (seconds >= intervals.year) {
    counter = Math.floor(seconds / intervals.year);
    if (locale === 'en') return counter === 1 ? `${counter} year ago` : `${counter} years ago`;
    return `${counter} năm trước`;
  }
  if (seconds >= intervals.month) {
    counter = Math.floor(seconds / intervals.month);
    if (locale === 'en') return counter === 1 ? `${counter} month ago` : `${counter} months ago`;
    return `${counter} tháng trước`;
  }
  if (seconds >= intervals.day) {
    counter = Math.floor(seconds / intervals.day);
    if (locale === 'en') return counter === 1 ? `${counter} day ago` : `${counter} days ago`;
    return `${counter} ngày trước`;
  }
  if (seconds >= intervals.hour) {
    counter = Math.floor(seconds / intervals.hour);
    if (locale === 'en') return counter === 1 ? `${counter} hour ago` : `${counter} hours ago`;
    return `${counter} giờ trước`;
  }
  if (seconds >= intervals.minute) {
    counter = Math.floor(seconds / intervals.minute);
    if (locale === 'en') return counter === 1 ? `${counter} minute ago` : `${counter} minutes ago`;
    return `${counter} phút trước`;
  }
  
  counter = Math.floor(seconds);
  if (locale === 'en') return counter <= 1 ? `a few seconds ago` : `${counter} seconds ago`;
  return `${counter} giây trước`;
};


const NewsSkeleton: React.FC = () => (
    <div className="bg-gray-900/50 rounded-lg p-4 animate-pulse">
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

// FIX: Define the props interface for the NewsFeed component.
interface NewsFeedProps {
  news: NewsArticle[];
  isLoading: boolean;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading }) => {
  const { t, locale } = useTranslation();
  return (
    <section className="glassmorphism p-6 rounded-lg shadow-2xl animate-fade-in h-full">
        <div className="flex items-center gap-3">
            <NewspaperIcon className="w-6 h-6 text-red-400"/>
            <h3 className="text-xl font-bold text-gray-200">Tin tức thị trường liên quan</h3>
        </div>
      <div className="mt-6 space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2">
        {isLoading ? (
          <>
            <NewsSkeleton />
            <NewsSkeleton />
            <NewsSkeleton />
          </>
        ) : news.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Không tìm thấy tin tức gần đây.</p>
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
                  <h4 className="text-sm sm:text-md font-bold text-gray-100 group-hover:text-red-400 transition-colors">
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