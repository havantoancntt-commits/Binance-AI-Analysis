import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Squares2X2Icon, XMarkIcon, Cog6ToothIcon } from './Icons';
import BinanceReferral from './BinanceReferral';
import SupportProject from './SupportProject';

const FloatingActionMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t, locale, setLocale } = useTranslation();

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <>
            <div className="fixed bottom-6 left-6 z-[100]">
                <button
                    onClick={openModal}
                    className="p-4 bg-gradient-to-r from-teal-500 to-violet-600 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background-rgb))] focus:ring-teal-400 transition-all duration-200 animate-pulse-shadow"
                    aria-label={t('utilities.menu.label')}
                >
                    <Squares2X2Icon className="w-8 h-8" />
                </button>
            </div>
            
            {isOpen && (
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
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <BinanceReferral />
                                <SupportProject />
                            </div>
                        </main>

                         <footer className="p-4 border-t border-[var(--border-color)] flex items-center justify-end flex-shrink-0">
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