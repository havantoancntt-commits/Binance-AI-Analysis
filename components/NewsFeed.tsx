import React from 'react';
import type { NewsArticle } from '../types';
import { NewspaperIcon } from './Icons';

interface NewsFeedProps {
  news: NewsArticle[];
  isLoading: boolean;
}

const formatTimeAgo = (timestamp: number) => {
  const now = new Date();
  const past = new Date(timestamp * 1000);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} năm trước`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} tháng trước`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} ngày trước`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} giờ trước`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} phút trước`;
  return `${Math.floor(seconds)} giây trước`;
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

const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading }) => {
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
                    <span>{formatTimeAgo(article.publishedOn)}</span>
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