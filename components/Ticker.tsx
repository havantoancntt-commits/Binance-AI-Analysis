import React, { useState, useEffect, useRef } from 'react';
import type { TickerData } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from './Icons';

interface TickerProps {
  coinPair: string | null;
  tickerData: TickerData | null;
}

const Ticker: React.FC<TickerProps> = ({ coinPair, tickerData }) => {
  const [priceAnimation, setPriceAnimation] = useState('');
  const prevPriceRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (tickerData?.price && prevPriceRef.current && tickerData.price !== prevPriceRef.current) {
      const currentPriceNum = parseFloat(tickerData.price.replace(/,/g, ''));
      const prevPriceNum = parseFloat(prevPriceRef.current.replace(/,/g, ''));

      if (currentPriceNum > prevPriceNum) {
        setPriceAnimation('animate-price-up');
      } else if (currentPriceNum < prevPriceNum) {
        setPriceAnimation('animate-price-down');
      }

      const timer = setTimeout(() => setPriceAnimation(''), 700);
      return () => clearTimeout(timer);
    }
  }, [tickerData?.price]);

  useEffect(() => {
    prevPriceRef.current = tickerData?.price;
  });

  if (!coinPair) {
    return null;
  }

  const changeColor = tickerData?.isPositive ? 'text-green-400' : 'text-red-400';
  const Icon = tickerData?.isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-white">{coinPair}</h2>
      </div>
      
      {tickerData ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-right">
            <div className={`flex items-baseline p-1 rounded-md transition-colors duration-700 ${priceAnimation}`}>
                <span className="text-3xl font-bold text-white">${tickerData.price}</span>
            </div>
          <div className={`flex items-center font-semibold ${changeColor}`}>
            <Icon className="w-5 h-5 mr-1" />
            <span>{tickerData.change} ({tickerData.changePercent})</span>
            <span className="text-gray-400 text-sm ml-2">24h</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-500">Đang tải dữ liệu thời gian thực...</div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Ticker);