import React, { useState, useEffect } from 'react';
import type { DelistingInfo, GroundingChunk } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { fetchDelistings } from '../services/delistingService';
import { ArchiveBoxXMarkIcon, LinkIcon, ArrowUpRightIcon } from './Icons';

const SkeletonRow: React.FC = () => (
    <tr className="border-b border-gray-800 shimmer-bg">
        <td className="p-4"><div className="h-4 bg-gray-700 rounded w-20"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-700 rounded w-full"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-700 rounded w-32"></div></td>
    </tr>
);

const DelistingWatchlist: React.FC = () => {
    const { t, locale } = useTranslation();
    const [delistings, setDelistings] = useState<DelistingInfo[]>([]);
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDelistings = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchDelistings(locale);
                setDelistings(data.delistings);
                setSources(data.sources);
            } catch (err: any) {
                setError(err.message || t('delisting.error.generic'));
            } finally {
                setIsLoading(false);
            }
        };
        loadDelistings();
    }, [locale, t]);

    return (
        <section className="glassmorphism p-6 rounded-lg h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <ArchiveBoxXMarkIcon className="w-8 h-8 text-rose-400"/>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-200">{t('delisting.title')}</h3>
                    <p className="text-sm text-gray-400">{t('delisting.subtitle')}</p>
                </div>
            </div>

            <div className="overflow-y-auto flex-grow no-scrollbar -mx-6 px-6">
                {isLoading ? (
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="p-4">{t('delisting.table.coin')}</th><th className="p-4">{t('delisting.table.exchange')}</th><th className="p-4">{t('delisting.table.reason')}</th><th className="p-4">{t('delisting.table.status')}</th>
                        </tr></thead>
                        <tbody><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></tbody>
                    </table>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-rose-400 bg-rose-500/10 rounded-lg p-4">{error}</div>
                ) : delistings.length === 0 ? (
                     <div className="flex items-center justify-center h-full text-gray-400 bg-gray-900/40 rounded-lg p-4">{t('delisting.empty')}</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-[var(--card-bg)] backdrop-blur-sm">
                           <tr className="border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-4">{t('delisting.table.coin')}</th>
                                <th className="p-4">{t('delisting.table.exchange')}</th>
                                <th className="p-4">{t('delisting.table.reason')}</th>
                                <th className="p-4">{t('delisting.table.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {delistings.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-4 font-bold text-white">{item.coin}</td>
                                    <td className="p-4 text-gray-300">{item.exchange}</td>
                                    <td className="p-4 text-gray-300">
                                        {item.reason}
                                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block ml-2 text-teal-400 hover:text-teal-300 transition-colors">
                                           <ArrowUpRightIcon className="w-3 h-3"/>
                                        </a>
                                    </td>
                                    <td className="p-4 text-amber-400 font-semibold">{item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {sources.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex-shrink-0">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        <LinkIcon className="w-4 h-4"/>{t('delisting.sourcesTitle')}
                    </h4>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                       {sources.map(source => (
                           <li key={source.web.uri}><a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">{source.web.title}</a></li>
                       ))}
                    </ul>
                 </div>
            )}
        </section>
    );
};

export default DelistingWatchlist;