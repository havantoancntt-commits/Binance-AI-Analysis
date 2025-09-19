import React from 'react';

const Box: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
    <div className={`shimmer-bg rounded-lg ${className}`} style={style}></div>
);

const AnalysisDisplaySkeleton: React.FC = () => (
    <div className="glassmorphism rounded-xl shadow-2xl w-full p-6 space-y-6 h-full flex flex-col" aria-label="Đang tải phân tích">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
            <div className="space-y-3 w-3/4">
                <Box className="h-8 w-full" />
                <Box className="h-4 w-5/6" />
            </div>
            <div className="flex gap-2">
                <Box className="h-9 w-9 rounded-lg" />
            </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-2 border-b border-violet-500/10">
            <Box className="h-10 w-28 rounded-t-lg" />
            <Box className="h-10 w-36 rounded-t-lg shimmer-bg" style={{backgroundColor: 'rgba(107, 114, 128, 0.1)'}} />
            <Box className="h-10 w-32 rounded-t-lg shimmer-bg" style={{backgroundColor: 'rgba(107, 114, 128, 0.1)'}} />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6 flex-grow">
            <Box className="h-10 w-full" /> 
            <Box className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-6">
                <Box className="h-24 w-full" />
                <Box className="h-24 w-full" />
            </div>
            <Box className="h-28 w-full flex-grow" />
        </div>
    </div>
);

export default AnalysisDisplaySkeleton;