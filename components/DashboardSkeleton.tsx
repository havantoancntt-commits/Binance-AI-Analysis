
import React from 'react';

const Box: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-800/60 rounded-lg ${className}`}></div>
);

const DashboardSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse animate-fade-in" aria-label="Đang tải nội dung">
        {/* Left & Center Column Skeleton */}
        <div className="lg:col-span-2">
            <Box className="h-[400px] sm:h-[500px] lg:h-[600px]" />
        </div>
        {/* Right Column Skeleton */}
        <div className="lg:col-span-1">
            <Box className="h-full min-h-[850px]" /> {/* For AnalysisDisplay */}
        </div>
    </div>
);

export default DashboardSkeleton;
