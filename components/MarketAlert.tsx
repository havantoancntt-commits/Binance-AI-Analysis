import React from 'react';
import type { AnalysisResult } from '../types';
import { ExclamationTriangleIcon, InformationCircleIcon, HandRaisedIcon } from './Icons';

interface MarketAlertProps {
    sentiment: AnalysisResult['marketSentiment'];
    coinPair: string;
}

const MarketAlert: React.FC<MarketAlertProps> = ({ sentiment, coinPair }) => {
    const sentimentConfig = {
        'Extreme Fear': {
            title: 'Cảnh Báo: Thị Trường Sợ Hãi Tột Độ',
            message: (coin: string) => `Biến động cực cao có thể xảy ra với ${coin}. Hãy quản lý rủi ro chặt chẽ và tránh các quyết định giao dịch bốc đồng. Đây là thời điểm cần hết sức thận trọng.`,
            icon: ExclamationTriangleIcon,
            colorClasses: 'border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-500/10 to-transparent text-fuchsia-300',
            iconColor: 'text-fuchsia-400'
        },
        'Fear': {
            title: 'Chú Ý: Tâm Lý Sợ Hãi Chiếm Ưu Thế',
            message: (coin: string) => `Thị trường ${coin} đang cho thấy sự do dự. Cân nhắc giảm thiểu rủi ro và chờ đợi tín hiệu xác nhận rõ ràng hơn trước khi vào lệnh mới.`,
            icon: ExclamationTriangleIcon,
            colorClasses: 'border-red-500/60 bg-gradient-to-r from-red-500/10 to-transparent text-red-300',
            iconColor: 'text-red-400'
        },
        'Neutral': {
            title: 'Thông Báo: Thị Trường Đang Đi Ngang',
            message: (coin: string) => `Thị trường ${coin} đang trong giai đoạn thiếu quyết đoán. Đây là thời điểm tốt để quan sát và lập kế hoạch cho động thái tiếp theo, thay vì hành động vội vàng.`,
            icon: InformationCircleIcon,
            colorClasses: 'border-amber-500/60 bg-gradient-to-r from-amber-500/10 to-transparent text-amber-300',
            iconColor: 'text-amber-400'
        },
        'Greed': {
            title: 'Lưu Ý: Tâm Lý Tham Lam Đang Tăng',
            message: (coin: string) => `Sự hưng phấn đang tăng lên đối với ${coin}. Hãy cẩn thận với FOMO (Hội chứng sợ bỏ lỡ) và đảm bảo tuân thủ kế hoạch chốt lời của bạn.`,
            icon: HandRaisedIcon,
            colorClasses: 'border-orange-500/60 bg-gradient-to-r from-orange-500/10 to-transparent text-orange-300',
            iconColor: 'text-orange-400'
        },
        'Extreme Greed': {
            title: 'Cảnh Báo: Thị Trường Tham Lam Tột Độ',
            message: (coin: string) => `Sự hưng phấn của thị trường ${coin} đang ở mức cực đoan, có thể dẫn đến một đợt điều chỉnh đột ngột. Hãy cân nhắc chốt lời một phần và tránh vào lệnh mua đuổi.`,
            icon: HandRaisedIcon,
            colorClasses: 'border-yellow-500/60 bg-gradient-to-r from-yellow-500/10 to-transparent text-yellow-300',
            iconColor: 'text-yellow-400'
        }
    };

    const config = sentimentConfig[sentiment];
    const Icon = config.icon;

    return (
        <div className={`p-4 rounded-lg border flex items-start gap-4 ${config.colorClasses} animate-fade-in-up`}>
            <Icon className={`w-8 h-8 flex-shrink-0 mt-1 ${config.iconColor}`} />
            <div>
                <h4 className="font-bold text-white">{config.title}</h4>
                <p className="text-sm mt-1">{config.message(coinPair)}</p>
            </div>
        </div>
    );
};

export default React.memo(MarketAlert);
