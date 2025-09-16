import React, { useRef, useEffect, useMemo } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea, Scatter } from 'recharts';
import type { PriceDataPoint, AnalysisResult, Timeframe, TickerData } from '../types';
import Ticker from './Ticker';

interface PriceChartProps {
  priceData: PriceDataPoint[];
  analysis: AnalysisResult | null;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  isChartLoading: boolean;
  tickerData: TickerData | null;
  coinPair: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const pricePayload = payload.find(p => p.dataKey === 'price');
    const volumePayload = payload.find(p => p.dataKey === 'volume');
    return (
      <div className="glassmorphism p-3 rounded-lg shadow-lg">
        <p className="label text-sm text-gray-300">{`Ngày : ${label}`}</p>
        {pricePayload && <p className="intro text-md font-bold text-cyan-400">{`Giá : $${pricePayload.value.toLocaleString()}`}</p>}
        {volumePayload && <p className="intro text-sm text-gray-400">{`KLGD : ${volumePayload.value.toLocaleString()}`}</p>}
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
    const bgColor = isBuy ? 'rgba(74, 222, 128, 0.9)' : 'rgba(248, 113, 113, 0.9)';
    const strokeColor = isBuy ? '#4ade80' : '#f87171';
    
    const labelYPosition = cy - 20;

    return (
        <g>
            <foreignObject x={cx - 25} y={labelYPosition - 15} width="50" height="28" style={{ overflow: 'visible' }}>
                <div 
                    style={{
                        backgroundColor: bgColor,
                        borderRadius: '6px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                        border: `1px solid ${isBuy ? 'rgba(130, 255, 180, 0.7)' : 'rgba(255, 130, 130, 0.7)'}`,
                        textAlign: 'center'
                    }}>
                    {payload.label}
                </div>
            </foreignObject>
            <polygon 
              points={`${cx},${labelYPosition + 13} ${cx - 5},${labelYPosition + 8} ${cx + 5},${labelYPosition + 8}`} 
              fill={bgColor} 
            />
            <circle cx={cx} cy={cy} r="4" fill={strokeColor} stroke="#0D1117" strokeWidth="2" />
        </g>
    );
};


const PriceChart: React.FC<PriceChartProps> = ({ priceData, analysis, timeframe, onTimeframeChange, isChartLoading, tickerData, coinPair }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const timeframes: Timeframe[] = ['1D', '7D', '1M', '1Y'];

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

  const signalPoints = useMemo(() => {
    if (!analysis || priceData.length < 2) return [];

    const points = [];
    const recentData = priceData.slice(-90);

    const buyZoneTop = analysis.buyZone.to;
    const buyCandidates = recentData.filter(p => p.price <= buyZoneTop * 1.05);
    if (buyCandidates.length > 0) {
        const buyPoint = buyCandidates.reduce((min, p) => p.price < min.price ? p : min, buyCandidates[0]);
        points.push({ ...buyPoint, type: 'buy', label: 'MUA' });
    }

    if (analysis.takeProfitLevels.length > 0) {
        const firstTakeProfit = analysis.takeProfitLevels[0];
        const sellCandidates = recentData.filter(p => p.price >= firstTakeProfit * 0.95);
        if (sellCandidates.length > 0) {
            const sellPoint = sellCandidates.reduce((max, p) => p.price > max.price ? p : max, sellCandidates[0]);
            points.push({ ...sellPoint, type: 'sell', label: 'BÁN' });
        }
    }
    
    const uniquePoints = Array.from(new Map(points.map(p => [p.date, p])).values());
    return uniquePoints;
  }, [analysis, priceData]);


  const renderChartContent = () => {
    if (priceData.length === 0 && !isChartLoading) {
        return <div className="flex items-center justify-center h-full text-gray-500">Không có dữ liệu biểu đồ.</div>;
    }

    const priceDomain: [number, number] = [
        Math.min(...priceData.map(p => p.price)) * 0.98,
        Math.max(...priceData.map(p => p.price)) * 1.02,
    ];
    
    const volumeDomain: [number, number] = [
        0,
        Math.max(...priceData.map(p => p.volume)) * 2.5,
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={priceData}
                margin={{ top: 5, right: 100, left: 20, bottom: 5 }}
            >
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke="#A0AEC0"
                    domain={priceDomain}
                    tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="right" orientation="right" stroke="#718096" domain={volumeDomain} tickFormatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#A0AEC0' }} />
                <Area type="monotone" dataKey="price" name="Giá" stroke="#2dd4bf" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" yAxisId="left" />
                <Bar dataKey="volume" name="Khối Lượng" barSize={20} fill="#4A5568" yAxisId="right" />

                {analysis && (
                    <>
                    <ReferenceArea yAxisId="left" y1={analysis.buyZone.from} y2={analysis.buyZone.to} stroke="#81E6D9" strokeDasharray="3 3" strokeOpacity={0.5} fill="#2C7A7B" fillOpacity={0.15} label={{ value: 'Vùng Mua', position: 'insideTopRight', fill: '#B2F5EA', fontSize: 14, fontWeight: 'bold' }} />

                    {analysis.supportLevels.map((level, index) => (
                        <ReferenceLine yAxisId="left" key={`sup-${index}`} y={level} label={{ value: `Hỗ trợ ${index + 1}`, position: 'right', fill: '#9AE6B4', fontSize: 12, dy: -5 }} stroke="#48BB78" strokeDasharray="4 4" strokeWidth={1.5} />
                    ))}
                    
                    {analysis.resistanceLevels.map((level, index) => (
                        <ReferenceLine yAxisId="left" key={`res-${index}`} y={level} label={{ value: `Kháng cự ${index + 1}`, position: 'right', fill: '#FEB2B2', fontSize: 12, dy: -5 }} stroke="#F56565" strokeDasharray="4 4" strokeWidth={1.5} />
                    ))}

                    {analysis.takeProfitLevels.map((level, index) => (
                        <ReferenceLine yAxisId="left" key={`tp-${index}`} y={level} label={{ value: `Chốt lời ${index + 1}`, position: 'right', fill: '#68D391', fontSize: 12, fontWeight: 'bold', dy: -5 }} stroke="#38A169" strokeWidth={2}/>
                    ))}
                    
                    <ReferenceLine yAxisId="left" y={analysis.stopLoss} label={{ value: 'Cắt lỗ', position: 'right', fill: '#FC8181', fontSize: 12, fontWeight: 'bold', dy: -5 }} stroke="#E53E3E" strokeWidth={2}/>
                    
                    <Scatter yAxisId="left" data={signalPoints} shape={<CustomSignalShape />} />
                    </>
                )}

            </ComposedChart>
        </ResponsiveContainer>
    );
  }


  return (
    <div ref={chartContainerRef} className="glassmorphism p-4 rounded-lg shadow-2xl h-full w-full flex flex-col relative">
        {isChartLoading && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
            <div className="w-full sm:w-auto">
                <Ticker coinPair={coinPair} tickerData={tickerData} />
            </div>
            <div className="flex-shrink-0 space-x-1">
                {timeframes.map((tf) => (
                    <button
                    key={tf}
                    onClick={() => onTimeframeChange(tf)}
                    disabled={isChartLoading}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed
                        ${timeframe === tf ? 'bg-cyan-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}`}
                    >
                    {tf}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex-grow w-full h-full">
            {renderChartContent()}
        </div>
    </div>
  );
};

export default React.memo(PriceChart);