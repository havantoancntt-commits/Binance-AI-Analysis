import React, { useRef, useMemo, useState } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Scatter, Cell, Label } from 'recharts';
import type { PriceDataPoint, AnalysisResult, TickerData, ChartTimeframe } from '../types';
import Ticker from './Ticker';
import { useTranslation } from '../hooks/useTranslation';
import { SparklesIcon, EyeIcon, EyeSlashIcon } from './Icons';

declare var html2canvas: any;

// A simple markdown-to-HTML converter for the AI response
const formatAIResponse = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\n/g, '<br />') // Newlines
        .replace(/(\*|\-)\s/g, '<br />&bull; '); // List items
};

const ChartInsightModal: React.FC<{ isOpen: boolean; onClose: () => void; chartImage: string | null; insight: string; isLoading: boolean; t: (key: string) => string; }> = ({ isOpen, onClose, chartImage, insight, isLoading, t }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glassmorphism aurora-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-fade-in-up" style={{animationDuration: '0.4s'}} onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-color)] flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-teal-300" />
                        {t('chart.insight.title')}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white">&times;</button>
                </header>
                <main className="p-6 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 no-scrollbar">
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-gray-400 text-sm">{t('chart.insight.snapshot')}</h4>
                        {chartImage ? <img src={chartImage} alt="Chart Snapshot" className="rounded-lg border border-violet-500/30" /> : <div className="shimmer-bg rounded-lg aspect-video"></div>}
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-gray-400 text-sm">{t('chart.insight.analysis')}</h4>
                        {isLoading ? (
                             <div className="space-y-3 pt-2">
                                <div className="h-4 bg-gray-700/50 rounded w-full shimmer-bg"></div>
                                <div className="h-4 bg-gray-700/50 rounded w-5/6 shimmer-bg"></div>
                                <div className="h-4 bg-gray-700/50 rounded w-full shimmer-bg"></div>
                             </div>
                        ) : (
                            <div className="text-sm text-gray-300 leading-relaxed bg-gray-900/50 p-4 rounded-lg flex-grow" dangerouslySetInnerHTML={{ __html: formatAIResponse(insight) }}></div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};


const formatLargeNumber = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const pricePayload = payload.find(p => p.dataKey === 'price');
    const volumePayload = payload.find(p => p.dataKey === 'volume');
    return (
      <div className="glassmorphism p-3 rounded-lg shadow-lg border-gray-700/50" style={{background: 'rgba(10, 5, 5, 0.8)'}}>
        <p className="label text-sm text-gray-400 font-semibold mb-2">{t('chart.tooltip.date', { label })}</p>
        {pricePayload && <p className="intro text-md font-bold text-teal-400">{t('chart.tooltip.price', { price: pricePayload.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) })}</p>}
        {volumePayload && <p className="intro text-sm text-gray-500">{t('chart.tooltip.volume', { volume: formatLargeNumber(volumePayload.value) })}</p>}
      </div>
    );
  }
  return null;
};

interface CustomSignalShapeProps {
  cx?: number;
  cy?: number;
  payload?: { type: 'buy' | 'sell'; label: string; };
}

const CustomSignalShape: React.FC<CustomSignalShapeProps> = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;
    const isBuy = payload.type === 'buy';
    const bgColor = isBuy ? '#22c55e' : '#ef4444';
    const strokeColor = isBuy ? '#86efac' : '#fca5a5';
    const labelYPosition = cy - 25;
    return (
        <g style={{ filter: `drop-shadow(0 0 5px ${bgColor}aa)` }}>
            <foreignObject x={cx - 25} y={labelYPosition - 15} width="50" height="28" style={{ overflow: 'visible' }}>
                <div style={{ backgroundColor: bgColor, borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', boxShadow: `0 2px 8px rgba(0,0,0,0.5)`, border: `1px solid ${strokeColor}`, textAlign: 'center' }}>
                    {payload.label}
                </div>
            </foreignObject>
            <polygon points={`${cx},${labelYPosition + 13} ${cx - 5},${labelYPosition + 8} ${cx + 5},${labelYPosition + 8}`} fill={bgColor} stroke={strokeColor} strokeWidth={1} />
            <circle cx={cx} cy={cy} r="4" fill={bgColor} stroke="#0D1117" strokeWidth="2" />
        </g>
    );
};

interface PriceChartProps {
  priceData: PriceDataPoint[];
  analysis: AnalysisResult | null;
  tickerData: TickerData | null;
  coinPair: string;
  activeTimeframe: ChartTimeframe;
  isPanelOpen: boolean;
  onTimeframeChange: (timeframe: ChartTimeframe) => void;
  onTogglePanel: () => void;
}

const PriceChart: React.FC<PriceChartProps> = ({ priceData, analysis, tickerData, coinPair, activeTimeframe, isPanelOpen, onTimeframeChange, onTogglePanel }) => {
  const { t } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);
  const [insightState, setInsightState] = useState({ isOpen: false, chartImage: null as string | null, insight: '', isLoading: false });

  const timeframes: {label: string, value: ChartTimeframe}[] = [
      { label: t('chart.timeframe.7d'), value: '7D'},
      { label: t('chart.timeframe.3m'), value: '3M'},
      { label: t('chart.timeframe.1y'), value: '1Y'},
  ];

  const handleGetInsight = async () => {
    if (!chartRef.current) return;
    setInsightState({ isOpen: true, chartImage: null, insight: '', isLoading: true });
    
    try {
        const canvas = await html2canvas(chartRef.current, {
            backgroundColor: 'rgb(8, 5, 12)',
            useCORS: true,
            scale: 1,
        });
        const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Get base64 part
        setInsightState(s => ({ ...s, chartImage: canvas.toDataURL('image/jpeg', 0.8) }));

        const response = await fetch('/api/interpret-chart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData }),
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }
        const { analysis } = await response.json();
        setInsightState(s => ({ ...s, insight: analysis, isLoading: false }));

    } catch (error) {
        console.error("Chart insight error:", error);
        setInsightState(s => ({ ...s, insight: t('chart.insight.error'), isLoading: false }));
    }
  };

  const processedData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    return priceData.map((d, i) => {
        if (i === 0) return { ...d, volumeColor: '#71717a' };
        const prevPrice = priceData[i - 1].price;
        return { ...d, volumeColor: d.price >= prevPrice ? '#166534' : '#991b1b' };
    });
  }, [priceData]);

  const signalPoints = useMemo(() => {
    if (!analysis || priceData.length < 2) return [];
    const points = [];
    const recentData = priceData.slice(-90);
    const buyZoneTop = analysis.buyZone.to;
    const buyCandidates = recentData.filter(p => p.price <= buyZoneTop * 1.05);
    if (buyCandidates.length > 0) {
        const buyPoint = buyCandidates.reduce((min, p) => p.price < min.price ? p : min, buyCandidates[0]);
        points.push({ ...buyPoint, type: 'buy', label: t('chart.signal.buy') });
    }
    if (analysis.takeProfitLevels.length > 0) {
        const firstTakeProfit = analysis.takeProfitLevels[0];
        const sellCandidates = recentData.filter(p => p.price >= firstTakeProfit * 0.95);
        if (sellCandidates.length > 0) {
            const sellPoint = sellCandidates.reduce((max, p) => p.price > max.price ? p : max, sellCandidates[0]);
            points.push({ ...sellPoint, type: 'sell', label: t('chart.signal.sell') });
        }
    }
    return Array.from(new Map(points.map(p => [p.date, p])).values());
  }, [analysis, priceData, t]);

  const renderChartSkeleton = () => (
    <div className="w-full h-full bg-gray-900/50 rounded-lg flex items-center justify-center shimmer-bg">
        <div className="text-gray-600 font-semibold">{t('chart.loading')}</div>
    </div>
  );

  const renderChartContent = () => {
    if (processedData.length === 0) return renderChartSkeleton();
    
    const allLevels = [
        ...(analysis?.supportLevels ?? []),
        ...(analysis?.resistanceLevels ?? []),
        ...(analysis?.takeProfitLevels ?? []),
        analysis?.stopLoss,
        analysis?.buyZone.from,
        analysis?.buyZone.to
    ].filter(v => v !== undefined) as number[];

    const minPrice = Math.min(...processedData.map(p => p.price), ...allLevels);
    const maxPrice = Math.max(...processedData.map(p => p.price), ...allLevels);
    
    const priceDomain: [number, number] = [minPrice * 0.98, maxPrice * 1.02];
    const volumeDomain: [number, number] = [0, Math.max(...processedData.map(p => p.volume)) * 2];
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processedData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-start)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-start)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} dy={10}>
                    <Label value={t('chart.label.date')} offset={-15} position="insideBottom" fill="#888" fontSize={12} />
                </XAxis>
                <YAxis yAxisId="left" orientation="left" stroke="#9ca3af" domain={volumeDomain} tickFormatter={(value) => formatLargeNumber(Number(value))} tick={{ fontSize: 12 }} dx={-5} width={60}>
                    <Label value={t('chart.label.volume')} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#888' }} fontSize={12} />
                </YAxis>
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" domain={priceDomain} tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`} tick={{ fontSize: 12 }} dx={5} width={80}>
                    <Label value={t('chart.label.price')} angle={90} position="insideRight" style={{ textAnchor: 'middle', fill: '#888' }} fontSize={12} />
                </YAxis>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-start)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="price" name="Giá" stroke="var(--accent-start)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" yAxisId="right" isAnimationActive={true} animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 6, stroke: '#140a0a', strokeWidth: 2, fill: 'var(--accent-start)' }} />
                <Bar dataKey="volume" name="Khối Lượng" barSize={30} yAxisId="left" fillOpacity={0.5} isAnimationActive={true} animationDuration={700} animationEasing="ease-in-out">
                    {processedData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.volumeColor} />))}
                </Bar>

                {analysis && (
                    <>
                    <ReferenceArea yAxisId="right" y1={analysis.buyZone.from} y2={analysis.buyZone.to} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.7} fill="#f59e0b" fillOpacity={0.2} label={{ value: t('chart.ref.buyZone'), position: 'insideTopLeft', fill: '#fcd34d', fontSize: 12, fontWeight: 'bold', dy: 10, dx: 10 }} />
                    {analysis.supportLevels.map((level, index) => (<ReferenceLine yAxisId="right" key={`sup-${index}`} y={level} label={{ value: t('chart.ref.support', { index: index + 1 }), position: 'right', fill: '#67e8f9', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#22d3ee" strokeDasharray="4 4" strokeWidth={1.5} />))}
                    {analysis.resistanceLevels.map((level, index) => (<ReferenceLine yAxisId="right" key={`res-${index}`} y={level} label={{ value: t('chart.ref.resistance', { index: index + 1 }), position: 'right', fill: '#d8b4fe', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#c084fc" strokeDasharray="4 4" strokeWidth={1.5} />))}
                    {analysis.takeProfitLevels.map((level, index) => (<ReferenceLine yAxisId="right" key={`tp-${index}`} y={level} label={{ value: t('chart.ref.takeProfit', { index: index + 1 }), position: 'right', fill: '#4ade80', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#22c55e" strokeWidth={2} strokeDasharray="8 4"/>))}
                    <ReferenceLine yAxisId="right" y={analysis.stopLoss} label={{ value: t('chart.ref.stopLoss'), position: 'right', fill: '#f87171', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5"/>
                    <Scatter yAxisId="right" data={signalPoints} shape={<CustomSignalShape />} />
                    </>
                )}
            </ComposedChart>
        </ResponsiveContainer>
    );
  }

  return (
    <div className="glassmorphism p-4 rounded-xl h-full w-full flex flex-col relative aurora-card" ref={chartRef}>
        <ChartInsightModal 
            isOpen={insightState.isOpen} 
            onClose={() => setInsightState({ isOpen: false, chartImage: null, insight: '', isLoading: false })}
            chartImage={insightState.chartImage}
            insight={insightState.insight}
            isLoading={insightState.isLoading}
            t={t}
        />
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
            <div className="w-full sm:w-auto">
                <Ticker coinPair={coinPair} tickerData={tickerData} />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                 <button onClick={handleGetInsight} disabled={insightState.isLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 bg-gray-900/60 text-teal-300 hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-wait shimmer-button">
                    <SparklesIcon className="w-4 h-4" /> {t('chart.button.getInsight')}
                 </button>
                 <button onClick={onTogglePanel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 bg-gray-900/60 text-violet-300 hover:bg-gray-700/80">
                    {isPanelOpen ? <EyeSlashIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                    {isPanelOpen ? t('chart.button.hidePanel') : t('chart.button.showPanel')}
                 </button>
                 <div className="bg-gray-900/60 p-1 rounded-lg flex items-center">
                    {timeframes.map(tf => (
                        <button key={tf.value} onClick={() => onTimeframeChange(tf.value)} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors duration-200 ${activeTimeframe === tf.value ? 'bg-gradient-to-r from-teal-500 to-violet-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <div className="flex-grow w-full h-full min-h-[300px]">
            {renderChartContent()}
        </div>
    </div>
  );
};

export default React.memo(PriceChart);