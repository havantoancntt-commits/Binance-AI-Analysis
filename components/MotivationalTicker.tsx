
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const MotivationalTicker: React.FC = () => {
  const { t } = useTranslation();
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  const quotes = useMemo(() => [
    t('motivationalTicker.1'),
    t('motivationalTicker.2'),
    t('motivationalTicker.3'),
    t('motivationalTicker.4'),
    t('motivationalTicker.5'),
    t('motivationalTicker.6'),
    t('motivationalTicker.7'),
    t('motivationalTicker.8'),
    t('motivationalTicker.9'),
    t('motivationalTicker.10'),
  ], [t]);

  const period = 2500; // Time to pause after typing a full quote

  useEffect(() => {
    const tick = () => {
      const i = loopNum % quotes.length;
      const fullText = quotes[i];

      let newText = '';
      if (isDeleting) {
        newText = fullText.substring(0, displayedText.length - 1);
      } else {
        newText = fullText.substring(0, displayedText.length + 1);
      }

      setDisplayedText(newText);

      if (!isDeleting && newText === fullText) {
        setTimeout(() => setIsDeleting(true), period);
      } else if (isDeleting && newText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const tickerTimeout = setTimeout(tick, isDeleting ? 50 : 120); // Typing/deleting speed
    return () => clearTimeout(tickerTimeout);
  }, [displayedText, isDeleting, loopNum, quotes]);
  
  // Initialize with a random quote index
  useEffect(() => {
    setLoopNum(Math.floor(Math.random() * quotes.length));
  }, [quotes.length]);

  return (
    <div className="text-center mt-8 h-12 flex items-center justify-center">
      <p className="text-md sm:text-lg italic text-orange-200/80 font-medium">
        "{displayedText}
        <span className="animate-pulse text-orange-400">|</span>"
      </p>
    </div>
  );
};

export default React.memo(MotivationalTicker);