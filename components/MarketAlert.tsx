
import React from 'react';
import type { AnalysisResult } from '../types';
import { ExclamationTriangleIcon, InformationCircleIcon, HandRaisedIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface MarketAlertProps {
    sentiment: AnalysisResult['marketSentiment'];
    coinPair: string;
}

const MarketAlert: React.FC<MarketAlertProps> = ({ sentiment, coinPair }) => {
    const { t } = useTranslation();

    const sentimentConfig = {
        'Extreme Fear': {
            title: t('marketAlert.extremeFear.title'),
            message: t('marketAlert.extremeFear.message', { coinPair }),
            icon: ExclamationTriangleIcon,
            colorClasses: 'border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-500/10 to-transparent text-fuchsia-300',
            iconColor: 'text-fuchsia-400'
        },
        'Fear': {
            title: t('marketAlert.fear.title'),
            message: t('marketAlert.fear.message', { coinPair }),
            icon: ExclamationTriangleIcon,
            colorClasses: 'border-red-500/60 bg-gradient-to-r from-red-500/10 to-transparent text-red-300',
            iconColor: 'text-red-400'
        },
        'Neutral': {
            title: t('marketAlert.neutral.title'),
            message: t('marketAlert.neutral.message', { coinPair }),
            icon: InformationCircleIcon,
            colorClasses: 'border-amber-500/60 bg-gradient-to-r from-amber-500/10 to-transparent text-amber-300',
            iconColor: 'text-amber-400'
        },
        'Greed': {
            title: t('marketAlert.greed.title'),
            message: t('marketAlert.greed.message', { coinPair }),
            icon: HandRaisedIcon,
            colorClasses: 'border-orange-500/60 bg-gradient-to-r from-orange-500/10 to-transparent text-orange-300',
            iconColor: 'text-orange-400'
        },
        'Extreme Greed': {
            title: t('marketAlert.extremeGreed.title'),
            message: t('marketAlert.extremeGreed.message', { coinPair }),
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
                <p className="text-sm mt-1">{config.message}</p>
            </div>
        </div>
    );
};

export default React.memo(MarketAlert);