import React, { useState, useEffect } from 'react';

const quotes = [
  "Đầu tư vào kiến thức mang lại lợi nhuận cao nhất.",
  "Sự giàu có không phải là có nhiều tiền, mà là có nhiều lựa chọn.",
  "Cơ hội không tự đến, bạn phải tạo ra chúng.",
  "Người bi quan nhìn thấy khó khăn trong mọi cơ hội. Người lạc quan nhìn thấy cơ hội trong mọi khó khăn.",
  "Thành công là đi từ thất bại này đến thất bại khác mà không mất đi lòng nhiệt huyết.",
  "Thị trường được thiết kế để chuyển tiền từ người năng động sang người kiên nhẫn.",
  "Quy tắc số 1: Không bao giờ để mất tiền. Quy tắc số 2: Không bao giờ quên Quy tắc số 1. - Warren Buffett",
  "Sự giàu có là khả năng trải nghiệm cuộc sống một cách trọn vẹn.",
  "Hãy tham lam khi người khác sợ hãi và chỉ sợ hãi khi người khác tham lam.",
  "Kỷ luật là cầu nối giữa mục tiêu và thành tựu."
];

const MotivationalTicker: React.FC = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

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
  }, [displayedText, isDeleting, loopNum]);
  
  // Initialize with a random quote index
  useEffect(() => {
    setLoopNum(Math.floor(Math.random() * quotes.length));
  }, []);

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