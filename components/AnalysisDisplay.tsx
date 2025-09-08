// FIX: The 'useRef' hook was used without being imported, causing a compilation error.
import React, { useState, useEffect, useRef } from 'react';
import type { AnalysisResult, Recommendation } from '../types';
import AnalysisDisplaySkeleton from './AnalysisDisplaySkeleton';
import { 
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon, ShieldCheckIcon, 
    RocketLaunchIcon, HandRaisedIcon, ArrowDownCircleIcon, LightBulbIcon, 
    ChartBarSquareIcon, DocumentArrowDownIcon, PhotoIcon, 
    InformationCircleIcon, TableCellsIcon, PencilSquareIcon,
    ClipboardIcon, CheckIcon
} from './Icons';

declare var html2pdf: any;

interface AnalysisDisplayProps {
  analysis: AnalysisResult | null;
  coinPair: string | null;
  isLoading: boolean;
}

const InfoCard: React.FC<{ title: string; value: string | number; colorClass: string; isPrice?: boolean; }> = ({ title, value, colorClass, isPrice = true }) => (
  <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col justify-between shadow-lg h-full transition-all duration-300 border border-gray-700 hover:border-cyan-500/50">
    <div className="text-gray-400 text-sm font-semibold">{title}</div>
    <div className={`text-2xl font-bold ${colorClass} text-right mt-2`}>
      {isPrice ? `$${Number(value).toLocaleString()}` : value}
    </div>
  </div>
);

const TrendIndicator: React.FC<{ trend: AnalysisResult['shortTermTrend'] }> = ({ trend }) => {
    let icon, text, color;
    switch(trend) {
        case 'Uptrend': icon = <ArrowTrendingUpIcon className="w-6 h-6" />; text = 'Xu Hướng Tăng'; color = 'text-green-400'; break;
        case 'Downtrend': icon = <ArrowTrendingDownIcon className="w-6 h-6" />; text = 'Xu Hướng Giảm'; color = 'text-red-400'; break;
        default: icon = <ArrowsRightLeftIcon className="w-6 h-6" />; text = 'Đi Ngang'; color = 'text-yellow-400';
    }
    return <div className={`flex items-center text-xl font-bold ${color}`}> {icon} <span className="ml-2">{text}</span> </div>;
};

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    let icon, text, bgColor, textColor, borderColor;
    switch (recommendation.signal) {
        case 'Strong Buy': icon = <RocketLaunchIcon />; text = 'MUA MẠNH'; bgColor = 'bg-green-500/10'; textColor = 'text-green-300'; borderColor = 'border-green-400'; break;
        case 'Buy': icon = <ArrowTrendingUpIcon />; text = 'MUA'; bgColor = 'bg-green-500/10'; textColor = 'text-green-400'; borderColor = 'border-green-500'; break;
        case 'Hold': icon = <HandRaisedIcon />; text = 'NẮM GIỮ'; bgColor = 'bg-yellow-500/10'; textColor = 'text-yellow-300'; borderColor = 'border-yellow-400'; break;
        case 'Sell': icon = <ArrowTrendingDownIcon />; text = 'BÁN'; bgColor = 'bg-red-500/10'; textColor = 'text-red-400'; borderColor = 'border-red-500'; break;
        case 'Strong Sell': icon = <ArrowDownCircleIcon />; text = 'BÁN MẠNH'; bgColor = 'bg-red-500/10'; textColor = 'text-red-300'; borderColor = 'border-red-400'; break;
        default: icon = <HandRaisedIcon />; text = 'TRÁNH GIAO DỊCH'; bgColor = 'bg-gray-600/20'; textColor = 'text-gray-400'; borderColor = 'border-gray-600';
    }

    return (
        <div className={`border-2 ${borderColor} ${bgColor} rounded-xl p-6 flex items-center space-x-4 md:space-x-6`}>
            <div className={`p-3 rounded-full ${bgColor} border-2 ${borderColor} flex-shrink-0`}>
                {React.cloneElement(icon, { className: `w-10 h-10 ${textColor}` })}
            </div>
            <div className="text-left flex-grow">
                <h3 className={`text-3xl font-bold ${textColor}`}>{text}</h3>
                <p className="text-gray-300 mt-1 text-md">{recommendation.reason}</p>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 h-full">
        <div className="flex items-center text-gray-400 text-sm mb-2">
            {icon}
            <span className="ml-2 font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {children}
    </div>
);

type Tab = 'overview' | 'setup' | 'notes' | 'exporting';

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, coinPair, isLoading }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [bullCopied, setBullCopied] = useState(false);
  const [bearCopied, setBearCopied] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  // Reset to overview tab when coin pair changes
  useEffect(() => {
    setActiveTab('overview');
  }, [coinPair]);
  
  if (isLoading) {
    return <AnalysisDisplaySkeleton />;
  }

  if (!analysis || !coinPair) return null;
  
  const formatPriceRange = (from: number, to: number) => `$${Math.min(from, to).toLocaleString()} - $${Math.max(from, to).toLocaleString()}`;

  const handleCopyToClipboard = (text: string, type: 'bull' | 'bear') => {
    navigator.clipboard.writeText(text).then(() => {
        if (type === 'bull') {
            setBullCopied(true);
            setTimeout(() => setBullCopied(false), 2000);
        } else {
            setBearCopied(true);
            setTimeout(() => setBearCopied(false), 2000);
        }
    });
  };
  
  const handleExport = async (asImage: boolean) => {
    if (!exportContainerRef.current) return;
    setIsExporting(true);
    
    // Temporarily switch to a "mode" that renders all content for export
    const originalTab = activeTab;
    setActiveTab('exporting');
    
    // Allow React to re-render with all content visible
    await new Promise(resolve => setTimeout(resolve, 50));

    const element = exportContainerRef.current;
    const date = new Date().toISOString().split('T')[0];
    const filename = `Analysis-${coinPair.replace('/', '-')}-${date}`;
    
    const opt = {
      margin: 0.5,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#161B22' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const pdfPromise = html2pdf().set(opt).from(element);
    
    try {
        if (asImage) {
            const canvas = await pdfPromise.toCanvas();
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } else {
            await pdfPromise.save();
        }
    } catch (error) {
        console.error("Export failed:", error);
    } finally {
        // Restore the original tab state and finish exporting
        setActiveTab(originalTab);
        setIsExporting(false);
    }
  };

  const TabButton: React.FC<{tabId: Tab; title: string; icon: React.ReactNode}> = ({tabId, title, icon}) => (
    <button
        role="tab"
        aria-selected={activeTab === tabId}
        onClick={() => setActiveTab(tabId)}
        className={`relative flex items-center gap-2 px-4 py-3 font-semibold rounded-t-lg transition-all duration-300 focus:outline-none ${activeTab === tabId ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
    >
      {icon}
      {title}
      {activeTab === tabId && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>}
    </button>
  );

  const renderOverview = () => (
    <div className="space-y-8">
        <RecommendationCard recommendation={analysis.recommendation} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Độ Tin Cậy" icon={<ShieldCheckIcon className="w-5 h-5" />}>
            <div className="text-3xl font-bold text-yellow-300">{`${analysis.confidenceScore}%`}</div>
            <p className="text-xs text-gray-400 mt-1">{analysis.confidenceReason}</p>
          </StatCard>
          <StatCard title="Xu Hướng" icon={<ChartBarSquareIcon className="w-5 h-5" />}>
            <TrendIndicator trend={analysis.shortTermTrend} />
          </StatCard>
        </div>
        <StatCard title="Động Lực Chính" icon={<LightBulbIcon className="w-5 h-5"/>}>
            <p className="text-purple-400 font-bold text-lg">{analysis.marketDriver}</p>
        </StatCard>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-8">
        <div className="bg-gradient-to-br from-cyan-900/70 to-gray-900/50 rounded-lg p-6 shadow-inner border border-cyan-500/30 text-center">
            <div className="text-gray-300 text-md mb-2">Vùng Mua Khuyến Nghị</div>
            <div className="text-4xl font-black text-cyan-300 py-2 tracking-wider">
                {formatPriceRange(analysis.buyZone.from, analysis.buyZone.to)}
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <InfoCard title="Chốt Lời 1" value={analysis.takeProfitLevels[0]} colorClass="text-teal-300" />
            <InfoCard title="Chốt Lời 2" value={analysis.takeProfitLevels[1]} colorClass="text-teal-300" />
            <InfoCard title="Mục tiêu Lớn" value={analysis.takeProfitLevels[2]} colorClass="text-teal-200 font-black" />
            <InfoCard title="Cắt Lỗ" value={analysis.stopLoss} colorClass="text-orange-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <InfoCard title="Hỗ Trợ 1" value={analysis.supportLevels[0]} colorClass="text-green-400" />
            <InfoCard title="Hỗ Trợ 2" value={analysis.supportLevels[1]} colorClass="text-green-400" />
            <InfoCard title="Kháng Cự 1" value={analysis.resistanceLevels[0]} colorClass="text-red-400" />
            <InfoCard title="Kháng Cự 2" value={analysis.resistanceLevels[1]} colorClass="text-red-400" />
        </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-6">
        <div className="relative">
            <h4 className="text-lg font-bold text-green-400 mb-2">Trường hợp Tăng giá (Bull Case)</h4>
            <blockquote className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-green-500 text-gray-300 leading-relaxed pr-12">
                {analysis.detailedAnalysis.bullCase}
            </blockquote>
            <button
              onClick={() => handleCopyToClipboard(analysis.detailedAnalysis.bullCase, 'bull')}
              className="absolute top-1/2 -translate-y-1/2 right-2 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
              aria-label="Sao chép trường hợp tăng giá"
            >
              {bullCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
            </button>
        </div>
        <div className="relative">
            <h4 className="text-lg font-bold text-red-400 mb-2">Trường hợp Giảm giá (Bear Case)</h4>
            <blockquote className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-red-500 text-gray-300 leading-relaxed pr-12">
                {analysis.detailedAnalysis.bearCase}
            </blockquote>
            <button
              onClick={() => handleCopyToClipboard(analysis.detailedAnalysis.bearCase, 'bear')}
              className="absolute top-1/2 -translate-y-1/2 right-2 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
              aria-label="Sao chép trường hợp giảm giá"
            >
              {bearCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
            </button>
        </div>
    </div>
  );

  return (
    <div className="glassmorphism rounded-lg shadow-2xl animate-fade-in w-full">
      <div id="analysis-report" className="p-6 rounded-t-lg">
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
              <h2 className="text-3xl font-bold text-white">Phân tích {coinPair}</h2>
              <p className="text-gray-400 mt-1">{analysis.summary}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
               <button onClick={() => handleExport(false)} disabled={isExporting} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait">
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>{isExporting ? 'Đang xuất...' : 'Lưu PDF'}</span>
              </button>
              <button onClick={() => handleExport(true)} disabled={isExporting} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait">
                  <PhotoIcon className="w-5 h-5" />
                  <span>{isExporting ? 'Đang xuất...' : 'Lưu ảnh'}</span>
              </button>
          </div>
        </header>
      </div>

      {activeTab !== 'exporting' && (
        <nav role="tablist" aria-label="Chi tiết phân tích" className="border-b border-gray-700 px-6 flex space-x-2">
          <TabButton tabId="overview" title="Tổng Quan" icon={<InformationCircleIcon className="w-5 h-5"/>}/>
          <TabButton tabId="setup" title="Thiết Lập Giao Dịch" icon={<TableCellsIcon className="w-5 h-5"/>}/>
          <TabButton tabId="notes" title="Ghi Chú Chuyên Sâu" icon={<PencilSquareIcon className="w-5 h-5"/>}/>
        </nav>
      )}

      <div ref={exportContainerRef} className="p-6 rounded-b-lg bg-gray-900/30">
        {(activeTab === 'overview' || activeTab === 'exporting') && (
            <div className={`animate-fade-in ${activeTab === 'exporting' ? 'space-y-8 mb-8' : ''}`}>
                {activeTab === 'exporting' && <h3 className="text-xl font-bold text-cyan-400 border-b border-gray-700 pb-2 mb-4">Tổng Quan</h3>}
                {renderOverview()}
            </div>
        )}
        {(activeTab === 'setup' || activeTab === 'exporting') && (
            <div className={`animate-fade-in ${activeTab === 'exporting' ? 'space-y-8 mb-8' : ''}`}>
                {activeTab === 'exporting' && <h3 className="text-xl font-bold text-cyan-400 border-b border-gray-700 pb-2 mb-4">Thiết Lập Giao Dịch</h3>}
                {renderSetup()}
            </div>
        )}
        {(activeTab === 'notes' || activeTab === 'exporting') && (
            <div className="animate-fade-in">
                {activeTab === 'exporting' && <h3 className="text-xl font-bold text-cyan-400 border-b border-gray-700 pb-2 mb-4">Ghi Chú Chuyên Sâu</h3>}
                {renderNotes()}
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AnalysisDisplay);