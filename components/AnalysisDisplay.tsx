import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { AnalysisResult, Recommendation, TrendInfo, Locale } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import AnalysisDisplaySkeleton from './AnalysisDisplaySkeleton';
import MarketAlert from './MarketAlert';
import { 
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon, ShieldCheckIcon, 
    RocketLaunchIcon, HandRaisedIcon, ArrowDownCircleIcon, LightBulbIcon, 
    ChartBarSquareIcon, DocumentArrowDownIcon,
    ClipboardIcon, CheckIcon, SparklesIcon, TableCellsIcon, PencilSquareIcon,
    InformationCircleIcon, ClipboardDocumentListIcon, CheckBadgeIcon
} from './Icons';

declare var html2pdf: any;

type ActiveTab = 'overview' | 'setup' | 'deepDive';

const StatCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; className?: string }> = ({ title, children, icon, className = '' }) => (
    <div className={`bg-gray-900/40 rounded-xl p-4 border border-violet-500/10 card-glow-hover ${className}`}>
        <div className="flex items-center text-violet-300 text-sm mb-3">
            {icon}
            <span className="ml-2 font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {children}
    </div>
);

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = `text-teal-300`;
  const inactiveClasses = 'text-gray-400 hover:text-white';
  return (
    <button onClick={onClick} className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-t-md ${isActive ? activeClasses : inactiveClasses}`} role="tab" aria-selected={isActive} >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    const { t } = useTranslation();
    let icon, text, mainColor, gradientFrom, gradientTo, borderColor, shadowColor;
    switch (recommendation.signal) {
        case 'Strong Buy': icon = <RocketLaunchIcon />; text = t('analysis.recommendation.strongBuy'); mainColor='text-teal-300'; gradientFrom='from-teal-500/20'; gradientTo='to-teal-500/0'; borderColor='border-teal-500/50'; shadowColor='shadow-teal-500/20'; break;
        case 'Buy': icon = <ArrowTrendingUpIcon />; text = t('analysis.recommendation.buy'); mainColor='text-green-400'; gradientFrom='from-green-500/20'; gradientTo='to-green-500/0'; borderColor='border-green-500/50'; shadowColor='shadow-green-500/20'; break;
        case 'Hold': icon = <HandRaisedIcon />; text = t('analysis.recommendation.hold'); mainColor='text-amber-300'; gradientFrom='from-amber-500/20'; gradientTo='to-amber-500/0'; borderColor='border-amber-400/50'; shadowColor='shadow-amber-400/20'; break;
        case 'Sell': icon = <ArrowTrendingDownIcon />; text = t('analysis.recommendation.sell'); mainColor='text-rose-400'; gradientFrom='from-rose-500/20'; gradientTo='to-rose-500/0'; borderColor='border-rose-500/50'; shadowColor='shadow-rose-500/20'; break;
        case 'Strong Sell': icon = <ArrowDownCircleIcon />; text = t('analysis.recommendation.strongSell'); mainColor='text-fuchsia-400'; gradientFrom='from-fuchsia-500/20'; gradientTo='to-fuchsia-500/0'; borderColor='border-fuchsia-500/50'; shadowColor='shadow-fuchsia-500/20'; break;
        default: icon = <HandRaisedIcon />; text = t('analysis.recommendation.avoid'); mainColor='text-gray-400'; gradientFrom='from-gray-600/20'; gradientTo='to-gray-600/0'; borderColor='border-gray-600/50'; shadowColor='shadow-gray-600/20';
    }
    return (
        <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl p-5 border ${borderColor} flex items-center space-x-4 shadow-lg ${shadowColor} card-glow-hover`}>
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
    const { t } = useTranslation();
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    return (
         <StatCard title={t('analysis.card.title.confidence')} icon={<ShieldCheckIcon className="w-5 h-5" />}>
            <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs><linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="var(--accent-start)" /><stop offset="100%" stopColor="var(--accent-end)" /></linearGradient></defs>
                        <circle cx="50" cy="50" r="45" className="stroke-current text-gray-700/50" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="45" stroke="url(#confidenceGradient)" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.5, 1)' }} />
                        <text x="50" y="55" textAnchor="middle" className="text-2xl font-bold fill-current text-white">{score}%</text>
                    </svg>
                </div>
                <p className="text-xs text-gray-400">{reason}</p>
            </div>
        </StatCard>
    );
};

const SentimentIndicator: React.FC<{ sentiment: AnalysisResult['marketSentiment'] }> = ({ sentiment }) => {
    const { t } = useTranslation();
    const sentimentConfig = { 'Extreme Fear': { text: t('analysis.sentiment.extremeFear'), color: 'text-fuchsia-500', value: 10 }, 'Fear': { text: t('analysis.sentiment.fear'), color: 'text-rose-400', value: 30 }, 'Neutral': { text: t('analysis.sentiment.neutral'), color: 'text-amber-400', value: 50 }, 'Greed': { text: t('analysis.sentiment.greed'), color: 'text-green-400', value: 70 }, 'Extreme Greed': { text: t('analysis.sentiment.extremeGreed'), color: 'text-teal-300', value: 90 } };
    const config = sentimentConfig[sentiment] || sentimentConfig['Neutral'];
    return (
        <StatCard title={t('analysis.card.title.sentiment')} icon={<SparklesIcon className="w-5 h-5" />}>
            <div className="pt-2">
                <div className="w-full bg-gray-700/50 rounded-full h-2 relative"><div className="h-2 rounded-full absolute top-0" style={{ width: '2px', left: `${config.value}%`, background: config.color.replace('text-',''), boxShadow: `0 0 8px 3px ${config.color.replace('text-','')}88`}}></div></div>
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>{t('analysis.sentiment.scale.fear')}</span><span>{t('analysis.sentiment.scale.greed')}</span></div>
                <div className={`text-center font-bold text-lg mt-2 ${config.color}`}>{config.text}</div>
            </div>
        </StatCard>
    );
};

const TrendIcon: React.FC<{ trend: TrendInfo['trend'] }> = ({ trend }) => {
    switch(trend) {
        case 'Uptrend': return <ArrowTrendingUpIcon className="w-5 h-5 text-teal-400" />;
        case 'Downtrend': return <ArrowTrendingDownIcon className="w-5 h-5 text-rose-400" />;
        default: return <ArrowsRightLeftIcon className="w-5 h-5 text-amber-400" />;
    }
};

const MultiTimeframeTrend: React.FC<{ trendAnalysis: AnalysisResult['trendAnalysis'] }> = ({ trendAnalysis }) => {
    const { t } = useTranslation();
    const TrendItem = ({ title, trendInfo }: { title: string; trendInfo: TrendInfo }) => (
        <div className="flex-1 text-center px-2"><h4 className="text-xs font-bold text-gray-300 mb-1">{title}</h4><div className="flex items-center justify-center gap-1.5"><TrendIcon trend={trendInfo.trend} /><span className="text-sm font-semibold">{trendInfo.trend}</span></div></div>
    );
    return (
        <StatCard title={t('analysis.card.title.trend')} icon={<ChartBarSquareIcon className="w-5 h-5" />}><div className="flex justify-between items-center divide-x divide-violet-500/10"><TrendItem title={t('analysis.trend.short')} trendInfo={trendAnalysis.shortTerm} /><TrendItem title={t('analysis.trend.medium')} trendInfo={trendAnalysis.mediumTerm} /><TrendItem title={t('analysis.trend.long')} trendInfo={trendAnalysis.longTerm} /></div></StatCard>
    );
};

const DeeperAnalysis: React.FC<{analysis: AnalysisResult}> = ({analysis}) => {
    const { t } = useTranslation();
    const [bullCopied, setBullCopied] = useState(false);
    const [bearCopied, setBearCopied] = useState(false);
    const copyToClipboard = (text: string, type: 'bull' | 'bear') => { navigator.clipboard.writeText(text).then(() => { if (type === 'bull') { setBullCopied(true); setTimeout(() => setBullCopied(false), 2000); } else { setBearCopied(true); setTimeout(() => setBearCopied(false), 2000); } }); };
    return(
        <StatCard title={t('analysis.card.title.deepAnalysis')} icon={<LightBulbIcon className="w-5 h-5"/>}>
            <div className="space-y-4">
                <div><h4 className="font-semibold text-gray-300 text-sm mb-1">{t('analysis.deepDive.driver')}</h4><p className="text-violet-300 font-semibold text-sm">{analysis.marketDriver}</p></div>
                <div className="relative"><h4 className="font-semibold text-teal-400 text-sm mb-1">{t('analysis.deepDive.bullCase')}</h4><blockquote className="bg-gray-900/50 p-3 rounded-md border-l-4 border-teal-500 text-gray-300 text-xs leading-relaxed pr-10">{analysis.detailedAnalysis.bullCase}</blockquote><button onClick={() => copyToClipboard(analysis.detailedAnalysis.bullCase, 'bull')} className="absolute top-1/2 right-1 p-2 text-gray-400 rounded-full hover:bg-gray-700 transition-colors">{bullCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}</button></div>
                 <div className="relative"><h4 className="font-semibold text-rose-400 text-sm mb-1">{t('analysis.deepDive.bearCase')}</h4><blockquote className="bg-gray-900/50 p-3 rounded-md border-l-4 border-rose-500 text-gray-300 text-xs leading-relaxed pr-10">{analysis.detailedAnalysis.bearCase}</blockquote><button onClick={() => copyToClipboard(analysis.detailedAnalysis.bearCase, 'bear')} className="absolute top-1/2 right-1 p-2 text-gray-400 rounded-full hover:bg-gray-700 transition-colors">{bearCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}</button></div>
            </div>
        </StatCard>
    )
}

const KeyTakeaways: React.FC<{ takeaways: string[] }> = ({ takeaways }) => {
    const { t } = useTranslation();
    return (
        <StatCard title={t('analysis.card.title.keyTakeaways')} icon={<ClipboardDocumentListIcon className="w-5 h-5" />}>
            <ul className="space-y-3 pt-2">
                {takeaways.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <CheckBadgeIcon className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{item}</span>
                    </li>
                ))}
            </ul>
        </StatCard>
    );
};

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
    const { t } = useTranslation();
    const formatPrice = (price: number) => `$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}`;
    return (
        <div className="space-y-6">
            <StatCard title={t('analysis.card.title.tradeZone')} icon={<TableCellsIcon className="w-5 h-5"/>}>
                <div className="divide-y divide-violet-900/50">
                    <LevelItem label={t('analysis.levels.buyZone')} value={`${formatPrice(analysis.buyZone.from)} - ${formatPrice(analysis.buyZone.to)}`} color="text-amber-300" />
                    {analysis.takeProfitLevels.map((level, i) => (
                        <LevelItem key={`tp-${i}`} label={t('analysis.levels.takeProfit', { index: i + 1 })} value={formatPrice(level)} color="text-teal-300" />
                    ))}
                    <LevelItem label={t('analysis.levels.stopLoss')} value={formatPrice(analysis.stopLoss)} color="text-rose-400 font-bold" />
                </div>
            </StatCard>
            <StatCard title={t('analysis.card.title.keyLevels')} icon={<ArrowsRightLeftIcon className="w-5 h-5"/>}>
                 <div className="divide-y divide-violet-900/50">
                    {analysis.supportLevels.map((level, i) => (
                        <LevelItem key={`sup-${i}`} label={t('analysis.levels.support', { index: i + 1 })} value={formatPrice(level)} color="text-cyan-400" />
                    ))}
                    {analysis.resistanceLevels.map((level, i) => (
                        <LevelItem key={`res-${i}`} label={t('analysis.levels.resistance', { index: i + 1 })} value={formatPrice(level)} color="text-purple-400" />
                    ))}
                </div>
            </StatCard>
        </div>
    );
};

interface AnalysisDisplayProps {
  analysis: AnalysisResult | null;
  coinPair: string | null;
  isLoading: boolean;
}

const AnalysisReportPDF: React.FC<Omit<AnalysisDisplayProps, 'isLoading'> & { t: (key: string, replacements?: Record<string, string | number>) => string, locale: Locale }> = ({ analysis, coinPair, t, locale }) => {
    if (!analysis || !coinPair) return null;

    const formatPrice = (price: number) => `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
    
    const getSignalStyle = (signal: Recommendation['signal']): React.CSSProperties => {
        const styles: Record<string, React.CSSProperties> = {
            'Strong Buy': { color: '#14b8a6', fontWeight: 'bold' },
            'Buy': { color: '#22c55e', fontWeight: 'bold' },
            'Hold': { color: '#ca8a04' },
            'Sell': { color: '#f43f5e' },
            'Strong Sell': { color: '#c026d3' },
            'Avoid': { color: '#52525b' },
        };
        return styles[signal] || {};
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: { fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '12px', lineHeight: '1.6', color: '#333', backgroundColor: '#fff', padding: '40px', width: '8.5in' },
        header: { textAlign: 'center', borderBottom: '2px solid #8b5cf6', paddingBottom: '15px', marginBottom: '25px' },
        h1: { fontSize: '28px', color: '#8b5cf6', margin: '0' },
        h2: { fontSize: '20px', color: '#111827', margin: '5px 0' },
        h3: { fontSize: '18px', color: '#14b8a6', borderBottom: '1px solid #99f6e4', paddingBottom: '5px', marginTop: '30px', marginBottom: '15px' },
        h4: { fontSize: '14px', color: '#1f2937', margin: '15px 0 5px 0', fontWeight: 'bold' },
        section: { marginBottom: '20px' },
        p: { margin: '0 0 10px 0' },
        strong: { color: '#111827' },
        ul: { paddingLeft: '20px', listStyleType: 'disc' },
        li: { marginBottom: '5px' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
        td: { padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' },
        tdLabel: { fontWeight: 'bold', width: '40%', backgroundColor: '#f9fafb' },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
        card: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', backgroundColor: '#f9fafb' },
        footer: { textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#6b7280' },
    };
    const reportDate = new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.h1}>Meta Mind Crypto</h1>
                <h2 style={styles.h2}>{t('pdf.title', { coinPair })}</h2>
                <p>{t('pdf.generatedDate')} {reportDate}</p>
            </header>

            <section style={styles.section}>
                <h3 style={styles.h3}>{t('pdf.section.overview')}</h3>
                <p style={styles.p}><strong>{t('pdf.signal')}</strong> <span style={getSignalStyle(analysis.recommendation.signal)}>{analysis.recommendation.reason}</span></p>
                <p style={styles.p}><strong>{t('pdf.outlook')}</strong> {analysis.summary}</p>
                 <div style={styles.grid}>
                    <div style={styles.card}>
                        <h4 style={{...styles.h4, marginTop: 0}}>{t('pdf.confidence')}</h4>
                        <p style={styles.p}><strong style={{fontSize: '24px', color: '#8b5cf6'}}>{analysis.confidenceScore}%</strong> - {analysis.confidenceReason}</p>
                    </div>
                    <div style={styles.card}>
                        <h4 style={{...styles.h4, marginTop: 0}}>{t('pdf.sentiment')}</h4>
                        <p style={{...styles.p, fontWeight: 'bold', fontSize: '18px'}}>{analysis.marketSentiment}</p>
                    </div>
                </div>
            </section>
            
            <section style={styles.section}>
                <h3 style={styles.h3}>{t('pdf.section.tradeSetup')}</h3>
                 <div style={styles.grid}>
                    <table style={{...styles.table, marginTop: 0}}><tbody>
                        <tr><td style={styles.tdLabel}>{t('pdf.buyZone')}</td><td style={styles.td}>{formatPrice(analysis.buyZone.from)} - {formatPrice(analysis.buyZone.to)}</td></tr>
                        {analysis.takeProfitLevels.map((lvl, i) => <tr key={i}><td style={styles.tdLabel}>{t('pdf.takeProfit', {index: i+1})}</td><td style={styles.td}>{formatPrice(lvl)}</td></tr>)}
                        <tr><td style={{...styles.tdLabel, color: '#f43f5e'}}>{t('pdf.stopLoss')}</td><td style={{...styles.td, fontWeight: 'bold'}}>{formatPrice(analysis.stopLoss)}</td></tr>
                    </tbody></table>
                    <table style={{...styles.table, marginTop: 0}}><tbody>
                        {analysis.supportLevels.map((lvl, i) => <tr key={i}><td style={styles.tdLabel}>{t('pdf.support', {index: i+1})}</td><td style={styles.td}>{formatPrice(lvl)}</td></tr>)}
                        {analysis.resistanceLevels.map((lvl, i) => <tr key={i}><td style={styles.tdLabel}>{t('pdf.resistance', {index: i+1})}</td><td style={styles.td}>{formatPrice(lvl)}</td></tr>)}
                    </tbody></table>
                 </div>
            </section>

             <section style={styles.section}>
                <h3 style={styles.h3}>{t('pdf.section.trend')}</h3>
                <table style={styles.table}><tbody>
                    <tr><td style={styles.tdLabel}>{t('pdf.trend.short')}</td><td style={styles.td}><strong>{analysis.trendAnalysis.shortTerm.trend}</strong>: {analysis.trendAnalysis.shortTerm.reason}</td></tr>
                    <tr><td style={styles.tdLabel}>{t('pdf.trend.medium')}</td><td style={styles.td}><strong>{analysis.trendAnalysis.mediumTerm.trend}</strong>: {analysis.trendAnalysis.mediumTerm.reason}</td></tr>
                    <tr><td style={styles.tdLabel}>{t('pdf.trend.long')}</td><td style={styles.td}><strong>{analysis.trendAnalysis.longTerm.trend}</strong>: {analysis.trendAnalysis.longTerm.reason}</td></tr>
                </tbody></table>
            </section>

            <section style={styles.section}>
                <h3 style={styles.h3}>{t('pdf.section.deepDive')}</h3>
                <h4 style={styles.h4}>{t('pdf.driver')}</h4>
                <p style={styles.p}>{analysis.marketDriver}</p>
                <div style={styles.grid}>
                    <div>
                        <h4 style={styles.h4}>{t('pdf.bullCase')}</h4>
                        <p style={styles.p}>{analysis.detailedAnalysis.bullCase}</p>
                    </div>
                    <div>
                        <h4 style={styles.h4}>{t('pdf.bearCase')}</h4>
                        <p style={styles.p}>{analysis.detailedAnalysis.bearCase}</p>
                    </div>
                </div>
                 <h4 style={styles.h4}>{t('pdf.takeaways')}</h4>
                <ul style={styles.ul}>{analysis.keyTakeaways.map((item, i) => <li key={i} style={styles.li}>{item}</li>)}</ul>
            </section>

            <footer style={styles.footer}>
                <p><strong>{t('pdf.disclaimer.title')}</strong> {t('pdf.disclaimer.text')}</p>
            </footer>
        </div>
    );
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, coinPair, isLoading }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const { t, locale } = useTranslation();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({});

  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (!analysis || !coinPair) return null;
  
  const handleExportPDF = async () => {
    if (!analysis || !coinPair) return;
    setIsExporting(true);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    const root = ReactDOM.createRoot(tempContainer);
    root.render(<AnalysisReportPDF analysis={analysis} coinPair={coinPair} t={t} locale={locale} />);
    
    await new Promise(resolve => setTimeout(resolve, 200));

    const date = new Date().toISOString().split('T')[0];
    const filename = `MetaMind-Analysis-${coinPair.replace('/', '-')}-${date}.pdf`;
    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    try {
        await html2pdf().from(tempContainer.children[0]).set(opt).save();
    } catch (error) {
        console.error("PDF Export failed:", error);
    } finally {
        root.unmount();
        document.body.removeChild(tempContainer);
        setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: t('analysis.tabs.overview'), icon: <InformationCircleIcon className="w-5 h-5" /> },
    { id: 'setup', label: t('analysis.tabs.setup'), icon: <TableCellsIcon className="w-5 h-5" /> },
    { id: 'deepDive', label: t('analysis.tabs.deepDive'), icon: <LightBulbIcon className="w-5 h-5" /> },
  ];

  React.useEffect(() => {
    const activeTabElement = tabsRef.current?.querySelector<HTMLElement>(`[role="tab"][aria-selected="true"]`);
    if (activeTabElement) {
      setSliderStyle({
        left: `${activeTabElement.offsetLeft}px`,
        width: `${activeTabElement.offsetWidth}px`,
      });
    }
  }, [activeTab]);
  
  return (
    <div className="rounded-xl w-full h-full flex flex-col backdrop-blur-2xl bg-[rgba(12,8,18,0.7)] border border-[rgba(139,92,246,0.2)] shadow-2xl shadow-black/40">
      <div className="flex-grow flex flex-col">
        <header className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{t('analysis.title')}</h2>
                <p className="text-gray-400 mt-1">{t('analysis.subtitle', { coinPair })}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={handleExportPDF} disabled={isExporting} className="p-2 text-gray-300 bg-gray-800/50 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-wait transform hover:scale-110" aria-label={t('analysis.button.savePdf')}>
                   {isExporting ? 
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    : <DocumentArrowDownIcon className="w-5 h-5" />}
                </button>
            </div>
        </header>

        <div className="border-b border-violet-500/10 px-2 sm:px-4">
          <div ref={tabsRef} className="relative flex" role="tablist">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
              />
            ))}
            <div
              className="absolute bottom-0 h-0.5 bg-teal-400 rounded-full transition-all duration-300 ease-in-out"
              style={sliderStyle}
            />
          </div>
        </div>

        <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto no-scrollbar">
            <MarketAlert sentiment={analysis.marketSentiment} coinPair={coinPair} />
            <div key={activeTab} className="animate-fade-in-up">
              {activeTab === 'overview' && (
                  <div className="space-y-6">
                      <RecommendationCard recommendation={analysis.recommendation} />
                      <StatCard title={t('analysis.card.title.strategicOutlook')} icon={<PencilSquareIcon className="w-5 h-5" />}><p className="text-sm text-gray-300 leading-relaxed">{analysis.summary}</p></StatCard>
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