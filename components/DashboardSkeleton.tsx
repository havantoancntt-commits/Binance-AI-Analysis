import React from 'react';
import AnalysisDisplaySkeleton from './AnalysisDisplaySkeleton';

const Box: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`shimmer-bg rounded-lg ${className}`}></div>
);

const PriceChartSkeleton: React.FC = () => (
    <div className="glassmorphism p-4 rounded-xl h-full w-full flex flex-col relative aurora-card">
        <div className="flex justify-between items-start mb-4 gap-2">
            <div className="w-1/2 space-y-2">
                <Box className="h-6 w-1/3" />
                <Box className="h-4 w-1/2" />
            </div>
            <div className="flex items-center gap-2">
                <Box className="h-8 w-24" />
                <Box className="h-8 w-24" />
                <Box className="h-8 w-32" />
            </div>
        </div>
        <div className="flex-grow w-full h-full min-h-[300px]">
            <Box className="h-full w-full" />
        </div>
    </div>
);

const DashboardSkeleton: React.FC = () => (
    <div className="animate-pulse" aria-label="Đang tải bảng điều khiển">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
            <div className="lg:col-span-8 h-full">
                <PriceChartSkeleton />
            </div>
            <div className="lg:col-span-4 h-full">
                <AnalysisDisplaySkeleton />
            </div>
        </div>
    </div>
);

export default DashboardSkeleton;