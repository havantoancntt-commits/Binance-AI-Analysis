
import React from 'react';

const Box: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`shimmer-bg rounded-lg ${className}`}></div>
);

const DashboardSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" aria-label="Đang tải bảng điều khiển">
        {/* Left Column Skeleton (Chart) */}
        <div className="lg:col-span-7">
            <Box className="h-[450px] sm:h-[500px] lg:h-[600px]" />
        </div>

        {/* Right Column Skeleton (Analysis & Actions) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Analysis Display Skeleton */}
            <div className="space-y-6 p-6 glassmorphism rounded-lg">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 w-3/4">
                        <Box className="h-8 w-full" />
                        <Box className="h-4 w-5/6" />
                    </div>
                    <Box className="h-9 w-9 rounded-md" />
                </div>
                <div className="flex space-x-2 border-b border-gray-700/50 pb-px">
                    <Box className="h-10 w-28" />
                    <Box className="h-10 w-36" />
                </div>
                <Box className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-6">
                    <Box className="h-24 w-full" />
                    <Box className="h-24 w-full" />
                </div>
            </div>

            {/* Action Center Skeleton */}
            <Box className="h-80 w-full" />
        </div>
    </div>
);

export default DashboardSkeleton;