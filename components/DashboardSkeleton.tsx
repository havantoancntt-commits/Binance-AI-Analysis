
import React from 'react';

const Box: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-800/60 rounded-lg ${className}`}></div>
);

const DashboardSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-pulse" aria-label="Đang tải bảng điều khiển">
        {/* Left Column Skeleton */}
        <div className="xl:col-span-2 space-y-8">
            {/* Price Chart Skeleton */}
            <Box className="h-[600px]" />
            {/* News Feed Skeleton */}
            <div className="space-y-4">
                <Box className="h-8 w-1/2" />
                <Box className="h-28 w-full" />
                <Box className="h-28 w-full" />
                <Box className="h-28 w-full" />
            </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="xl:col-span-1 space-y-8">
            {/* Analysis Display Skeleton */}
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 w-3/4">
                        <Box className="h-8 w-full" />
                        <Box className="h-4 w-5/6" />
                    </div>
                    <div className="flex gap-2">
                        <Box className="h-9 w-9" />
                        <Box className="h-9 w-9" />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Box className="h-10 w-28" />
                    <Box className="h-10 w-36" />
                </div>
                <Box className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-6">
                    <Box className="h-24 w-full" />
                    <Box className="h-24 w-full" />
                </div>
                <Box className="h-28 w-full" />
            </div>
        </div>
    </div>
);

export default DashboardSkeleton;
