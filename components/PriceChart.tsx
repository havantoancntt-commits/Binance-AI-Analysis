import React, { useRef, useEffect, useMemo } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Scatter, Cell, Label } from 'recharts';
import type { PriceDataPoint, AnalysisResult, TickerData, ChartTimeframe } from '../types';
import Ticker from './Ticker';
import { useTranslation } from '../hooks/useTranslation';

const formatLargeNumber = (num: number) => {
    if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(2)}K`;
    }
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
  payload?: {
    type: 'buy' | 'sell';
    label: string;
  };
}

const CustomSignalShape: React.FC<CustomSignalShapeProps> = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;

    const isBuy = payload.type === 'buy';
    const bgColor = isBuy ? '#22c55e' : '#ef4444'; // green-500, red-500
    const strokeColor = isBuy ? '#86efac' : '#fca5a5'; // green-300, red-300
    const textColor = 'white';
    
    const labelYPosition = cy - 25;

    return (
        <g style={{ filter: `drop-shadow(0 0 5px ${bgColor}aa)` }}>
            <foreignObject x={cx - 25} y={labelYPosition - 15} width="50" height="28" style={{ overflow: 'visible' }}>
                <div 
                    style={{
                        backgroundColor: bgColor,
                        borderRadius: '6px',
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
                        border: `1px solid ${strokeColor}`,
                        textAlign: 'center'
                    }}>
                    {payload.label}
                </div>
            </foreignObject>
            <polygon 
              points={`${cx},${labelYPosition + 13} ${cx - 5},${labelYPosition + 8} ${cx + 5},${labelYPosition + 8}`} 
              fill={bgColor} 
              stroke={strokeColor}
              strokeWidth={1}
            />
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
  onTimeframeChange: (timeframe: ChartTimeframe) => void;
}

const PriceChart: React.FC<PriceChartProps> = ({ priceData, analysis, tickerData, coinPair, activeTimeframe, onTimeframeChange }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const timeframes: {label: string, value: ChartTimeframe}[] = [
      { label: t('chart.timeframe.7d'), value: '7D'},
      { label: t('chart.timeframe.3m'), value: '3M'},
      { label: t('chart.timeframe.1y'), value: '1Y'},
  ];

  useEffect(() => {
    if (analysis && chartContainerRef.current) {
      const element = chartContainerRef.current;
      element.classList.remove('animate-chart-shake');
      void element.offsetWidth;
      element.classList.add('animate-chart-shake');

      const animationTimeout = setTimeout(() => {
        element.classList.remove('animate-chart-shake');
      }, 500);

      return () => clearTimeout(animationTimeout);
    }
  }, [analysis]);

  const processedData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    return priceData.map((d, i) => {
        if (i === 0) return { ...d, volumeColor: '#71717a' }; // zinc-500 for the first bar
        const prevPrice = priceData[i - 1].price;
        return {
            ...d,
            volumeColor: d.price >= prevPrice ? '#166534' : '#991b1b', // dark green-800, dark red-800
        };
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
    
    const uniquePoints = Array.from(new Map(points.map(p => [p.date, p])).values());
    return uniquePoints;
  }, [analysis, priceData, t]);


  const renderChartSkeleton = () => (
    <div className="w-full h-full bg-gray-900/50 rounded-lg flex items-center justify-center shimmer-bg">
        <div className="text-gray-600 font-semibold">{t('chart.loading')}</div>
    </div>
  );

  const renderChartContent = () => {
    if (processedData.length === 0) {
        return renderChartSkeleton();
    }
    
    const priceDomain: [number, number] = [
        Math.min(...processedData.map(p => p.price)) * 0.95,
        Math.max(...processedData.map(p => p.price)) * 1.05,
    ];

    const volumeDomain: [number, number] = [
        0,
        Math.max(...processedData.map(p => p.volume)) * 2,
    ];
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={processedData}
                margin={{ top: 5, right: 20, left: 20, bottom: 20 }}
            >
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-start)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-start)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="chartBackground" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(20, 184, 166, 0.05)" />
                        <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} dy={10}>
                    <Label value={t('chart.label.date')} offset={-15} position="insideBottom" fill="#888" fontSize={12} />
                </XAxis>
                <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke="#9ca3af"
                    domain={volumeDomain}
                    tickFormatter={(value) => formatLargeNumber(Number(value))}
                    tick={{ fontSize: 12 }}
                    dx={-5}
                    width={60}
                >
                    <Label value={t('chart.label.volume')} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#888' }} fontSize={12} />
                </YAxis>
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#9ca3af"
                    domain={priceDomain}
                    tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                    tick={{ fontSize: 12 }}
                    dx={5}
                    width={80}
                >
                    <Label value={t('chart.label.price')} angle={90} position="insideRight" style={{ textAnchor: 'middle', fill: '#888' }} fontSize={12} />
                </YAxis>
                
                <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: 'var(--accent-start)', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                
                <Area yAxisId="right" type="monotone" dataKey={() => priceDomain[1]} stroke="none" fill="url(#chartBackground)" />

                <Area type="monotone" dataKey="price" name="Giá" stroke="var(--accent-start)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" yAxisId="right" isAnimationActive={true} animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 6, stroke: '#140a0a', strokeWidth: 2, fill: 'var(--accent-start)' }} />
                
                <Bar dataKey="volume" name="Khối Lượng" barSize={30} yAxisId="left" fillOpacity={0.5} isAnimationActive={true} animationDuration={700} animationEasing="ease-in-out">
                    {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.volumeColor} />
                    ))}
                </Bar>

                {analysis && (
                    <>
                    <ReferenceArea yAxisId="right" y1={analysis.buyZone.from} y2={analysis.buyZone.to} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.7} fill="#f59e0b" fillOpacity={0.2} label={{ value: t('chart.ref.buyZone'), position: 'insideTopLeft', fill: '#fcd34d', fontSize: 12, fontWeight: 'bold', dy: 10, dx: 10 }} />

                    {analysis.supportLevels.map((level, index) => (
                        <ReferenceLine yAxisId="right" key={`sup-${index}`} y={level} label={{ value: t('chart.ref.support', { index: index + 1 }), position: 'right', fill: '#67e8f9', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#22d3ee" strokeDasharray="4 4" strokeWidth={1.5} />
                    ))}
                    
                    {analysis.resistanceLevels.map((level, index) => (
                        <ReferenceLine yAxisId="right" key={`res-${index}`} y={level} label={{ value: t('chart.ref.resistance', { index: index + 1 }), position: 'right', fill: '#d8b4fe', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#c084fc" strokeDasharray="4 4" strokeWidth={1.5} />
                    ))}

                    {analysis.takeProfitLevels.map((level, index) => (
                        <ReferenceLine yAxisId="right" key={`tp-${index}`} y={level} label={{ value: t('chart.ref.takeProfit', { index: index + 1 }), position: 'right', fill: '#4ade80', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#22c55e" strokeWidth={2} strokeDasharray="8 4"/>
                    ))}
                    
                    <ReferenceLine yAxisId="right" y={analysis.stopLoss} label={{ value: t('chart.ref.stopLoss'), position: 'right', fill: '#f87171', fontSize: 12, dy: -5, dx: 10, fontWeight: 'bold' }} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5"/>
                    
                    <Scatter yAxisId="right" data={signalPoints} shape={<CustomSignalShape />} />
                    </>
                )}

            </ComposedChart>
        </ResponsiveContainer>
    );
  }

  return (
    <div ref={chartContainerRef} className="glassmorphism p-4 rounded-lg h-full w-full flex flex-col relative">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
            <div className="w-full sm:w-auto">
                <Ticker coinPair={coinPair} tickerData={tickerData} />
            </div>
             <div className="bg-gray-900/60 p-1 rounded-lg flex items-center self-end sm:self-center flex-shrink-0">
                {timeframes.map(tf => (
                    <button 
                      key={tf.value} 
                      onClick={() => onTimeframeChange(tf.value)} 
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors duration-200 ${activeTimeframe === tf.value ? 'bg-gradient-to-r from-teal-500 to-violet-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        {tf.label}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex-grow w-full h-full min-h-[300px]">
            {renderChartContent()}
        </div>
    </div>
  );
};

export default React.memo(PriceChart);