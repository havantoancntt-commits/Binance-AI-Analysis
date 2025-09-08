import React from 'react';

const Box: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-800/60 rounded-lg animate-pulse ${className}`}></div>
);

const AnalysisDisplaySkeleton: React.FC = () => (
    <div className="glassmorphism rounded-lg shadow-2xl w-full p-6 space-y-6" aria-label="Đang tải phân tích">
        {/* Header Skeleton */}
        <div className="space-y-3">
            <Box className="h-8 w-3/4" />
            <Box className="h-4 w-full" />
            <Box className="h-4 w-5/6" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-4 border-b border-gray-700">
            <div className="h-10 w-24 py-3"><Box className="h-full w-full" /></div>
            <div className="h-10 w-32 py-3"><Box className="h-full w-full" /></div>
            <div className="h-10 w-40 py-3"><Box className="h-full w-full" /></div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
            <Box className="h-28 w-full" />
            <div className="grid grid-cols-2 gap-6">
                <Box className="h-24 w-full" />
                <Box className="h-24 w-full" />
            </div>
            <Box className="h-16 w-full" />
        </div>
    </div>
);

export default AnalysisDisplaySkeleton;
