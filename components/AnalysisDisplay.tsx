import React, { useState, useRef } from 'react';
import type { AnalysisResult, Recommendation } from '../types';
import AnalysisDisplaySkeleton from './AnalysisDisplaySkeleton';
import { 
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon, ShieldCheckIcon, 
    RocketLaunchIcon, HandRaisedIcon, ArrowDownCircleIcon, LightBulbIcon, 
    ChartBarSquareIcon, DocumentArrowDownIcon, PhotoIcon, 
    ClipboardIcon, CheckIcon, SparklesIcon, TableCellsIcon, PencilSquareIcon
} from './Icons';

declare var html2pdf: any;

interface AnalysisDisplayProps {
  analysis: AnalysisResult | null;
  coinPair: string | null;
  isLoading: boolean;
}

type AnalysisTab = 'overview' | 'setup' | 'deep';

const TrendIndicator: React.FC<{ trend: AnalysisResult['shortTermTrend'] }> = ({ trend }) => {
    let icon, text, color;
    switch(trend) {
        case 'Uptrend': icon = <ArrowTrendingUpIcon className="w-6 h-6" />; text = 'Xu Hướng Tăng'; color = 'text-green-400'; break;
        case 'Downtrend': icon = <ArrowTrendingDownIcon className="w-6 h-6" />; text = 'Xu Hướng Giảm'; color = 'text-red-400'; break;
        default: icon = <ArrowsRightLeftIcon className="w-6 h-6" />; text = 'Đi Ngang'; color = 'text-yellow-400';
    }
    return <div className={`flex items-center text-xl font-bold ${color}`}> {icon} <span className="ml-2">{text}</span> </div>;
};

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    let icon, text, bgColor, textColor, borderColor;
    switch (recommendation.signal) {
        case 'Strong Buy': icon = <RocketLaunchIcon />; text = 'MUA MẠNH'; bgColor = 'bg-green-500/10'; textColor = 'text-green-300'; borderColor = 'border-green-400'; break;
        case 'Buy': icon = <ArrowTrendingUpIcon />; text = 'MUA'; bgColor = 'bg-green-500/10'; textColor = 'text-green-400'; borderColor = 'border-green-500'; break;
        case 'Hold': icon = <HandRaisedIcon />; text = 'NẮM GIỮ'; bgColor = 'bg-yellow-500/10'; textColor = 'text-yellow-300'; borderColor = 'border-yellow-400'; break;
        case 'Sell': icon = <ArrowTrendingDownIcon />; text = 'BÁN'; bgColor = 'bg-red-500/10'; textColor = 'text-red-400'; borderColor = 'border-red-500'; break;
        case 'Strong Sell': icon = <ArrowDownCircleIcon />; text = 'BÁN MẠNH'; bgColor = 'bg-red-500/10'; textColor = 'text-red-300'; borderColor = 'border-red-400'; break;
        default: icon = <HandRaisedIcon />; text = 'TRÁNH GIAO DỊCH'; bgColor = 'bg-gray-600/20'; textColor = 'text-gray-400'; borderColor = 'border-gray-600';
    }

    return (
        <div className={`border-2 ${borderColor} ${bgColor} rounded-xl p-6 flex items-center space-x-4 md:space-x-6`}>
            <div className={`p-3 rounded-full ${bgColor} border-2 ${borderColor} flex-shrink-0`}>
                {React.cloneElement(icon, { className: `w-10 h-10 ${textColor}` })}
            </div>
            <div className="text-left flex-grow">
                <h3 className={`text-3xl font-bold ${textColor}`}>{text}</h3>
                <p className="text-gray-300 mt-1 text-md">{recommendation.reason}</p>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 h-full">
        <div className="flex items-center text-gray-400 text-sm mb-2">
            {icon}
            <span className="ml-2 font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {children}
    </div>
);

const SentimentIndicator: React.FC<{ sentiment: AnalysisResult['marketSentiment'] }> = ({ sentiment }) => {
    const sentimentConfig = {
        'Extreme Fear': { text: 'Sợ hãi tột độ', color: 'text-red-500', bgColor: 'bg-red-500/20', value: 10 },
        'Fear': { text: 'Sợ hãi', color: 'text-orange-400', bgColor: 'bg-orange-400/20', value: 30 },
        'Neutral': { text: 'Trung lập', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', value: 50 },
        'Greed': { text: 'Tham lam', color: 'text-green-400', bgColor: 'bg-green-400/20', value: 70 },
        'Extreme Greed': { text: 'Tham lam tột độ', color: 'text-emerald-400', bgColor: 'bg-emerald-400/20', value: 90 },
    };
    const config = sentimentConfig[sentiment] || sentimentConfig['Neutral'];
    return (
        <StatCard title="Tâm Lý Thị Trường" icon={<SparklesIcon className="w-5 h-5" />}>
            <div className="relative h-20 flex flex-col justify-end">
                <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${config.bgColor.replace('bg-', '')}`}
                        style={{ width: `${config.value}%`, backgroundImage: `linear-gradient(to right, ${config.bgColor.replace('bg-','').split('/')[0]}, ${config.color.replace('text-', '')})` }}
                    ></div>
                </div>
                <div className={`absolute bottom-5 font-bold text-lg ${config.color}`} style={{ left: `calc(${config.value}% - 2.5rem)` }}>
                    {config.text}
                </div>
            </div>
        </StatCard>
    );
};

const TradingSetupDetails: React.FC<{analysis: AnalysisResult}> = ({ analysis }) => {
    const formatPrice = (price: number) => `$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}`;
    const formatPriceRange = (from: number, to: number) => `${formatPrice(Math.min(from, to))} - ${formatPrice(Math.max(from, to))}`;

    const setupItems = [
        { label: 'Vùng Mua', value: formatPriceRange(analysis.buyZone.from, analysis.buyZone.to), color: 'text-cyan-300 font-bold text-lg' },
        ...analysis.takeProfitLevels.map((level, i) => ({
            label: `Chốt Lời ${i + 1}`, value: formatPrice(level), color: 'text-teal-300'
        })),
        { label: 'Cắt Lỗ', value: formatPrice(analysis.stopLoss), color: 'text-orange-400' },
        ...analysis.supportLevels.map((level, i) => ({
            label: `Hỗ Trợ ${i + 1}`, value: formatPrice(level), color: 'text-green-400'
        })),
        ...analysis.resistanceLevels.map((level, i) => ({
            label: `Kháng Cự ${i + 1}`, value: formatPrice(level), color: 'text-red-400'
        })),
    ];

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="space-y-3">
                {setupItems.map(item => (
                    <div key={item.label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">{item.label}</span>
                        <span className={`font-mono ${item.color}`}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }> = ({ active, onClick, icon, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500
            ${active ? 'bg-gray-800/60 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800/30 hover:text-gray-200'}`}
    >
        {icon}
        {children}
    </button>
);


const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, coinPair, isLoading }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [bullCopied, setBullCopied] = useState(false);
  const [bearCopied, setBearCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const exportContainerRef = useRef<HTMLDivElement>(null);
  
  if (isLoading) {
    return <AnalysisDisplaySkeleton />;
  }

  if (!analysis || !coinPair) return null;

  const handleCopyToClipboard = (text: string, type: 'bull' | 'bear') => {
    navigator.clipboard.writeText(text).then(() => {
        if (type === 'bull') {
            setBullCopied(true);
            setTimeout(() => setBullCopied(false), 2000);
        } else {
            setBearCopied(true);
            setTimeout(() => setBearCopied(false), 2000);
        }
    });
  };
  
  const handleExport = async (asImage: boolean) => {
    if (!exportContainerRef.current) return;
    setIsExporting(true);
    
    await new Promise(resolve => setTimeout(resolve, 50));

    const element = exportContainerRef.current;
    const date = new Date().toISOString().split('T')[0];
    const filename = `Analysis-${coinPair.replace('/', '-')}-${date}`;
    
    const opt = {
      margin: 0.5,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#161B22' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const pdfPromise = html2pdf().set(opt).from(element);
    
    try {
        if (asImage) {
            const canvas = await pdfPromise.toCanvas();
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } else {
            await pdfPromise.save();
        }
    } catch (error) {
        console.error("Export failed:", error);
    } finally {
        setIsExporting(false);
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
        case 'overview':
            return (
                <div className="space-y-6 animate-fade-in">
                    <RecommendationCard recommendation={analysis.recommendation} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard title="Độ Tin Cậy" icon={<ShieldCheckIcon className="w-5 h-5" />}>
                            <div className="text-3xl font-bold text-yellow-300">{`${analysis.confidenceScore}%`}</div>
                            <p className="text-xs text-gray-400 mt-1">{analysis.confidenceReason}</p>
                        </StatCard>
                        <StatCard title="Xu Hướng" icon={<ChartBarSquareIcon className="w-5 h-5" />}>
                            <TrendIndicator trend={analysis.shortTermTrend} />
                        </StatCard>
                    </div>
                    <SentimentIndicator sentiment={analysis.marketSentiment} />
                </div>
            );
        case 'setup':
            return (
                 <div className="space-y-6 animate-fade-in">
                    <TradingSetupDetails analysis={analysis} />
                </div>
            );
        case 'deep':
            return (
                <div className="space-y-6 animate-fade-in">
                    <StatCard title="Động Lực Chính" icon={<LightBulbIcon className="w-5 h-5"/>}>
                        <p className="text-purple-400 font-bold text-lg">{analysis.marketDriver}</p>
                    </StatCard>
                    <div className="relative">
                        <h4 className="text-lg font-bold text-green-400 mb-2">Trường hợp Tăng giá (Bull Case)</h4>
                        <blockquote className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-green-500 text-gray-300 leading-relaxed pr-12">
                            {analysis.detailedAnalysis.bullCase}
                        </blockquote>
                        <button
                            onClick={() => handleCopyToClipboard(analysis.detailedAnalysis.bullCase, 'bull')}
                            className="absolute top-1/2 -translate-y-1/2 right-2 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                            aria-label="Sao chép trường hợp tăng giá"
                        >
                            {bullCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="relative">
                        <h4 className="text-lg font-bold text-red-400 mb-2">Trường hợp Giảm giá (Bear Case)</h4>
                        <blockquote className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-red-500 text-gray-300 leading-relaxed pr-12">
                            {analysis.detailedAnalysis.bearCase}
                        </blockquote>
                        <button
                            onClick={() => handleCopyToClipboard(analysis.detailedAnalysis.bearCase, 'bear')}
                            className="absolute top-1/2 -translate-y-1/2 right-2 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                            aria-label="Sao chép trường hợp giảm giá"
                        >
                            {bearCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            );
    }
  };

  return (
    <div className="glassmorphism rounded-lg shadow-2xl animate-fade-in w-full h-full flex flex-col">
      <div id="analysis-report" ref={exportContainerRef} className="flex-grow flex flex-col">
        <div className="p-6 flex-grow flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Phân tích {coinPair}</h2>
                    <p className="text-gray-400 mt-1">{analysis.summary}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleExport(false)} disabled={isExporting} className="p-2 text-gray-300 bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait" aria-label="Lưu PDF">
                        <DocumentArrowDownIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleExport(true)} disabled={isExporting} className="p-2 text-gray-300 bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait" aria-label="Lưu ảnh">
                        <PhotoIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="border-b border-gray-700 mb-6">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<ChartBarSquareIcon className="w-5 h-5" />}>Tổng quan</TabButton>
                    <TabButton active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<TableCellsIcon className="w-5 h-5" />}>Thiết lập Giao dịch</TabButton>
                    <TabButton active={activeTab === 'deep'} onClick={() => setActiveTab('deep')} icon={<PencilSquareIcon className="w-5 h-5" />}>Phân tích Sâu</TabButton>
                </nav>
            </div>

            <main className="flex-grow">
                {renderTabContent()}
            </main>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnalysisDisplay);