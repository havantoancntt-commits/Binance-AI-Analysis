import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { ChatMessage } from '../types';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, CpuChipIcon } from './Icons';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [input, setInput] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Chat and Welcome Message
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `Bạn là 'Meta Mind', một trợ lý AI thông minh chuyên về thị trường tiền điện tử. 
                    Chuyên môn của bạn bao gồm phân tích kỹ thuật, xu hướng thị trường, và giải thích các khái niệm tài chính phức tạp. 
                    Bạn phải luôn giao tiếp bằng tiếng Việt. Hãy trả lời một cách hữu ích, sâu sắc và súc tích.`,
                },
            });
            setChat(newChat);
        } catch (error) {
            console.error("Lỗi khởi tạo AI Chat:", error);
            setMessages([{
                role: 'model',
                text: "Rất tiếc, đã xảy ra lỗi khi kết nối với trợ lý AI. Vui lòng kiểm tra lại cấu hình API."
            }]);
        }
        
        setMessages([{
            role: 'model',
            text: "Xin chào! Tôi là trợ lý AI của Meta Mind. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi những câu như:\n\n- Phân tích xu hướng của BTC/USDT.\n- Giải thích chỉ báo RSI là gì?\n- So sánh giữa SOL và ETH."
        }]);

    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: input });

            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]); // Add empty model message

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            <div className={`
                ${isOpen ? 'animate-slide-in-bottom-right' : 'hidden'}
                w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[600px]
                flex flex-col glassmorphism rounded-xl shadow-2xl overflow-hidden
            `}>
                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-red-500/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-red-400" />
                        <h3 className="font-bold text-lg text-white">Meta Mind Assistant</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4 no-scrollbar">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                                msg.role === 'user' 
                                ? 'bg-red-600 text-white rounded-br-lg' 
                                : 'bg-gray-800 text-gray-200 rounded-bl-lg'
                            }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-gray-800 rounded-bl-lg flex items-center">
                                 <div className="thinking-dots text-gray-400"></div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <footer className="p-4 bg-gray-900/50 border-t border-red-500/30 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Hỏi bất cứ điều gì..."
                            disabled={isLoading}
                            className="w-full bg-gray-800 text-gray-100 placeholder-gray-500 px-4 py-2 rounded-full border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-2.5 text-white bg-red-600 rounded-full hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </footer>
            </div>

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`
                    ${!isOpen ? 'block' : 'hidden'}
                    p-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full shadow-lg
                    hover:scale-110 hover:shadow-red-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500
                    transition-all duration-200
                `}
                aria-label="Mở Trợ lý AI"
            >
                <SparklesIcon className="w-8 h-8" />
            </button>
        </div>
    );
};

export default Chatbot;