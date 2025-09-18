import React, { useState, useRef } from 'react';
import type { AnalysisResult, Recommendation, TrendInfo } from '../types';
import AnalysisDisplaySkeleton from './AnalysisDisplaySkeleton';
import { 
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon, ShieldCheckIcon, 
    RocketLaunchIcon, HandRaisedIcon, ArrowDownCircleIcon, LightBulbIcon, 
    ChartBarSquareIcon, DocumentArrowDownIcon, PhotoIcon, 
    ClipboardIcon, CheckIcon, SparklesIcon, TableCellsIcon, PencilSquareIcon,
    InformationCircleIcon, ClipboardDocumentListIcon, CheckBadgeIcon
} from './Icons';

declare var html2pdf: any;

type ActiveTab = 'overview' | 'setup' | 'deepDive';

interface AnalysisDisplayProps {
  analysis: AnalysisResult | null;
  coinPair: string | null;
  isLoading: boolean;
}

const StatCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; className?: string }> = ({ title, children, icon, className = '' }) => (
    <div className={`bg-gray-900/50 rounded-lg p-4 border border-gray-700 h-full interactive-card card-glow-hover ${className}`}>
        <div className="flex items-center text-gray-400 text-sm mb-3">
            {icon}
            <span className="ml-2 font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {children}
    </div>
);

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; activeColor: string; }> = ({ label, icon, isActive, onClick, activeColor }) => {
  const activeClasses = `border-b-2 ${activeColor} text-white`;
  const inactiveClasses = 'border-b-2 border-transparent text-gray-400 hover:text-white hover:border-gray-600/50';
  return (
    <button onClick={onClick} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm focus:outline-none ${isActive ? activeClasses : inactiveClasses}`} role="tab" aria-selected={isActive} >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    let icon, text, mainColor, gradientFrom, gradientTo, borderColor, shadowColor;
    switch (recommendation.signal) {
        case 'Strong Buy': icon = <RocketLaunchIcon />; text = 'MUA MẠNH'; mainColor='text-red-400'; gradientFrom='from-red-500/20'; gradientTo='to-red-500/0'; borderColor='border-red-500/50'; shadowColor='shadow-red-500/20'; break;
        case 'Buy': icon = <ArrowTrendingUpIcon />; text = 'MUA'; mainColor='text-orange-400'; gradientFrom='from-orange-500/20'; gradientTo='to-orange-500/0'; borderColor='border-orange-500/50'; shadowColor='shadow-orange-500/20'; break;
        case 'Hold': icon = <HandRaisedIcon />; text = 'NẮM GIỮ'; mainColor='text-amber-300'; gradientFrom='from-amber-500/20'; gradientTo='to-amber-500/0'; borderColor='border-amber-400/50'; shadowColor='shadow-amber-400/20'; break;
        case 'Sell': icon = <ArrowTrendingDownIcon />; text = 'BÁN'; mainColor='text-purple-400'; gradientFrom='from-purple-500/20'; gradientTo='to-purple-500/0'; borderColor='border-purple-500/50'; shadowColor='shadow-purple-500/20'; break;
        case 'Strong Sell': icon = <ArrowDownCircleIcon />; text = 'BÁN MẠNH'; mainColor='text-fuchsia-400'; gradientFrom='from-fuchsia-500/20'; gradientTo='to-fuchsia-500/0'; borderColor='border-fuchsia-500/50'; shadowColor='shadow-fuchsia-500/20'; break;
        default: icon = <HandRaisedIcon />; text = 'TRÁNH'; mainColor='text-gray-400'; gradientFrom='from-gray-600/20'; gradientTo='to-gray-600/0'; borderColor='border-gray-600/50'; shadowColor='shadow-gray-600/20';
    }
    return (
        <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl p-5 border ${borderColor} flex items-center space-x-4 shadow-lg ${shadowColor} interactive-card card-glow-hover`}>
            <div className={`p-2 sm:p-3 rounded-full bg-gray-900/50 border ${borderColor} flex-shrink-0`}>
                {React.cloneElement(icon, { className: `w-10 h-10 sm:w-12 h-12 ${mainColor}` })}
            </div>
            <div className="text-left flex-grow">
                <h3 className={`text-2xl sm:text-3xl font-bold ${mainColor}`}>{text}</h3>
                <p className="text-gray-300 mt-1 text-sm">{recommendation.reason}</p>
            </div>
        </div>
    );
};

const ConfidenceGauge: React.FC<{ score: number, reason: string }> = ({ score, reason }) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    return (
         <StatCard title="Độ Tin Cậy" icon={<ShieldCheckIcon className="w-5 h-5" />}>
            <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs><linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
                        <circle cx="50" cy="50" r="45" className="stroke-current text-gray-700" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="45" className="stroke-current" stroke="url(#confidenceGradient)" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />
                        <text x="50" y="55" textAnchor="middle" className="text-2xl font-bold fill-current text-white">{score}%</text>
                    </svg>
                </div>
                <p className="text-xs text-gray-400">{reason}</p>
            </div>
        </StatCard>
    );
};

const SentimentIndicator: React.FC<{ sentiment: AnalysisResult['marketSentiment'] }> = ({ sentiment }) => {
    const sentimentConfig = { 'Extreme Fear': { text: 'Sợ hãi tột độ', color: 'text-fuchsia-500', value: 10 }, 'Fear': { text: 'Sợ hãi', color: 'text-purple-400', value: 30 }, 'Neutral': { text: 'Trung lập', color: 'text-orange-400', value: 50 }, 'Greed': { text: 'Tham lam', color: 'text-amber-400', value: 70 }, 'Extreme Greed': { text: 'Tham lam tột độ', color: 'text-yellow-300', value: 90 } };
    const config = sentimentConfig[sentiment] || sentimentConfig['Neutral'];
    return (
        <StatCard title="Tâm Lý Thị Trường" icon={<SparklesIcon className="w-5 h-5" />}>
            <div className="pt-2">
                <div className="w-full bg-gray-700/50 rounded-full h-2 relative"><div className="h-2 rounded-full absolute top-0" style={{ width: '1px', left: `${config.value}%`, background: config.color.replace('text-',''), boxShadow: `0 0 8px 3px ${config.color.replace('text-','')}66`}}></div></div>
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Sợ hãi</span><span>Tham lam</span></div>
                <div className={`text-center font-bold text-lg mt-2 ${config.color}`}>{config.text}</div>
            </div>
        </StatCard>
    );
};

const TrendIcon: React.FC<{ trend: TrendInfo['trend'] }> = ({ trend }) => {
    switch(trend) {
        case 'Uptrend': return <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-400" />;
        case 'Downtrend': return <ArrowTrendingDownIcon className="w-5 h-5 text-purple-400" />;
        default: return <ArrowsRightLeftIcon className="w-5 h-5 text-orange-400" />;
    }
};

const MultiTimeframeTrend: React.FC<{ trendAnalysis: AnalysisResult['trendAnalysis'] }> = ({ trendAnalysis }) => {
    const TrendItem = ({ title, trendInfo }: { title: string; trendInfo: TrendInfo }) => (
        <div className="flex-1 text-center px-2"><h4 className="text-xs font-bold text-gray-300 mb-1">{title}</h4><div className="flex items-center justify-center gap-1.5"><TrendIcon trend={trendInfo.trend} /><span className="text-sm font-semibold">{trendInfo.trend}</span></div></div>
    );
    return (
        <StatCard title="Dự báo Xu hướng" icon={<ChartBarSquareIcon className="w-5 h-5" />}><div className="flex justify-between items-center divide-x divide-gray-700"><TrendItem title="Ngắn hạn" trendInfo={trendAnalysis.shortTerm} /><TrendItem title="Trung hạn" trendInfo={trendAnalysis.mediumTerm} /><TrendItem title="Dài hạn" trendInfo={trendAnalysis.longTerm} /></div></StatCard>
    );
};

const DeeperAnalysis: React.FC<{analysis: AnalysisResult}> = ({analysis}) => {
    const [bullCopied, setBullCopied] = useState(false);
    const [bearCopied, setBearCopied] = useState(false);
    const copyToClipboard = (text: string, type: 'bull' | 'bear') => { navigator.clipboard.writeText(text).then(() => { if (type === 'bull') { setBullCopied(true); setTimeout(() => setBullCopied(false), 2000); } else { setBearCopied(true); setTimeout(() => setBearCopied(false), 2000); } }); };
    return(
        <StatCard title="Phân Tích Sâu" icon={<LightBulbIcon className="w-5 h-5"/>}>
            <div className="space-y-4">
                <div><h4 className="font-semibold text-gray-300 text-sm mb-1">Động Lực Chính:</h4><p className="text-orange-400 font-semibold text-sm">{analysis.marketDriver}</p></div>
                <div className="relative"><h4 className="font-semibold text-yellow-400 text-sm mb-1">Kịch bản Tăng giá:</h4><blockquote className="bg-gray-900/50 p-3 rounded-md border-l-4 border-yellow-500 text-gray-300 text-xs leading-relaxed pr-10">{analysis.detailedAnalysis.bullCase}</blockquote><button onClick={() => copyToClipboard(analysis.detailedAnalysis.bullCase, 'bull')} className="absolute top-1/2 right-1 p-2 text-gray-400 rounded-full hover:bg-gray-700 transition-colors">{bullCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}</button></div>
                 <div className="relative"><h4 className="font-semibold text-purple-400 text-sm mb-1">Kịch bản Giảm giá:</h4><blockquote className="bg-gray-900/50 p-3 rounded-md border-l-4 border-purple-500 text-gray-300 text-xs leading-relaxed pr-10">{analysis.detailedAnalysis.bearCase}</blockquote><button onClick={() => copyToClipboard(analysis.detailedAnalysis.bearCase, 'bear')} className="absolute top-1/2 right-1 p-2 text-gray-400 rounded-full hover:bg-gray-700 transition-colors">{bearCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}</button></div>
            </div>
        </StatCard>
    )
}

const KeyTakeaways: React.FC<{ takeaways: string[] }> = ({ takeaways }) => (
    <StatCard title="Điểm Mấu Chốt" icon={<ClipboardDocumentListIcon className="w-5 h-5" />}>
        <ul className="space-y-3 pt-2">
            {takeaways.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                    <CheckBadgeIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{item}</span>
                </li>
            ))}
        </ul>
    </StatCard>
);

const LevelItem: React.FC<{ label: string; value: string; color: string; }> = ({ label, value, color }) => (
    <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center">
            <span className={`h-2 w-2 rounded-full mr-3 ${color.replace('text-', 'bg-')}`}></span>
            <span className="text-gray-400 text-sm">{label}</span>
        </div>
        <span className={`font-mono font-semibold text-sm ${color}`}>{value}</span>
    </div>
);

const TradingSetupPanel: React.FC<{analysis: AnalysisResult}> = ({ analysis }) => {
    const formatPrice = (price: number) => `$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}`;
    return (
        <div className="space-y-6">
            <StatCard title="Vùng Giao Dịch" icon={<TableCellsIcon className="w-5 h-5"/>}>
                <div className="divide-y divide-gray-800/70">
                    <LevelItem label="Vùng Mua" value={`${formatPrice(analysis.buyZone.from)} - ${formatPrice(analysis.buyZone.to)}`} color="text-amber-300" />
                    {analysis.takeProfitLevels.map((level, i) => (
                        <LevelItem key={`tp-${i}`} label={`Chốt Lời ${i + 1}`} value={formatPrice(level)} color="text-yellow-300" />
                    ))}
                    <LevelItem label="Cắt Lỗ" value={formatPrice(analysis.stopLoss)} color="text-red-400 font-bold" />
                </div>
            </StatCard>
            <StatCard title="Các Mức Cản Chính" icon={<ArrowsRightLeftIcon className="w-5 h-5"/>}>
                 <div className="divide-y divide-gray-800/70">
                    {analysis.supportLevels.map((level, i) => (
                        <LevelItem key={`sup-${i}`} label={`Hỗ Trợ ${i + 1}`} value={formatPrice(level)} color="text-cyan-400" />
                    ))}
                    {analysis.resistanceLevels.map((level, i) => (
                        <LevelItem key={`res-${i}`} label={`Kháng Cự ${i + 1}`} value={formatPrice(level)} color="text-purple-400" />
                    ))}
                </div>
            </StatCard>
        </div>
    );
};


const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, coinPair, isLoading }) => {
  const [isExporting, setIsExporting] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (!analysis || !coinPair) return null;
  
  const handleExport = async (asImage: boolean) => {
    if (!exportContainerRef.current) return;
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    const element = exportContainerRef.current;
    const date = new Date().toISOString().split('T')[0];
    const filename = `Analysis-${coinPair.replace('/', '-')}-${date}`;
    const opt = { margin: 0.5, filename: `${filename}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#140a0a' }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
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
  
  return (
    <div className="glassmorphism rounded-lg animate-fade-in-up w-full h-full flex flex-col">
      <div id="analysis-report" ref={exportContainerRef} className="flex-grow flex flex-col">
        <header className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Bảng Điều Khiển Chiến Lược</h2>
                <p className="text-gray-400 mt-1">Phân tích AI cho <span className="font-bold text-orange-400">{coinPair}</span></p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleExport(false)} disabled={isExporting} className="p-2 text-gray-300 bg-gray-800/50 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-wait transform hover:scale-110" aria-label="Lưu PDF"><DocumentArrowDownIcon className="w-5 h-5" /></button>
                <button onClick={() => handleExport(true)} disabled={isExporting} className="p-2 text-gray-300 bg-gray-800/50 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-wait transform hover:scale-110" aria-label="Lưu ảnh"><PhotoIcon className="w-5 h-5" /></button>
            </div>
        </header>

        <div className="border-b border-gray-700/50 px-2 sm:px-4">
          <nav className="-mb-px flex flex-wrap sm:flex-nowrap" aria-label="Tabs">
            <TabButton label="Tổng Quan" icon={<InformationCircleIcon className="w-5 h-5" />} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} activeColor="border-orange-500" />
            <TabButton label="Thiết Lập Giao Dịch" icon={<TableCellsIcon className="w-5 h-5" />} isActive={activeTab === 'setup'} onClick={() => setActiveTab('setup')} activeColor="border-cyan-500" />
            <TabButton label="Phân Tích Sâu" icon={<LightBulbIcon className="w-5 h-5" />} isActive={activeTab === 'deepDive'} onClick={() => setActiveTab('deepDive')} activeColor="border-purple-500" />
          </nav>
        </div>

        <main className="flex-grow p-4 sm:p-6">
            <div key={activeTab} className="animate-fade-in-up">
              {activeTab === 'overview' && (
                  <div className="space-y-6">
                      <RecommendationCard recommendation={analysis.recommendation} />
                      <StatCard title="Triển vọng Chiến lược" icon={<PencilSquareIcon className="w-5 h-5" />}><p className="text-sm text-gray-300 leading-relaxed">{analysis.summary}</p></StatCard>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><ConfidenceGauge score={analysis.confidenceScore} reason={analysis.confidenceReason} /><SentimentIndicator sentiment={analysis.marketSentiment} /></div>
                      <MultiTimeframeTrend trendAnalysis={analysis.trendAnalysis} />
                  </div>
              )}
              {activeTab === 'setup' && (
                  <TradingSetupPanel analysis={analysis} />
              )}
              {activeTab === 'deepDive' && (
                  <div className="space-y-6">
                      <DeeperAnalysis analysis={analysis} />
                      <KeyTakeaways takeaways={analysis.keyTakeaways} />
                  </div>
              )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default React.memo(AnalysisDisplay);