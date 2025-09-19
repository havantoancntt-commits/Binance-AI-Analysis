
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
        <div className="lg:col-span-5">
             <Box className="h-[450px] sm:h-[500px] lg:h-[600px]" />
        </div>
    </div>
);

export default DashboardSkeleton;