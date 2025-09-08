import React from 'react';

const Box: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-800/60 rounded-lg ${className}`}></div>
);

const DashboardSkeleton: React.FC = () => (
    <div className="animate-pulse animate-fade-in" aria-label="Đang tải nội dung">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 h-[400px] sm:h-[500px] lg:h-[600px]">
                <Box className="w-full h-full" />
            </div>
            <div className="lg:col-span-2 space-y-4">
                <Box className="w-full h-[250px]" />
                <Box className="w-full h-[334px]" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
            <div className="lg:col-span-3 h-[500px]">
                <Box className="w-full h-full" />
            </div>
            <div className="lg:col-span-2 h-[500px]">
                <Box className="w-full h-full" />
            </div>
        </div>
    </div>
);

export default DashboardSkeleton;
