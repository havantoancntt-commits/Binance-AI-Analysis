import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { ChatMessage, GroundingChunk } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, CpuChipIcon, UserCircleIcon, LinkIcon, ArrowUpRightIcon } from './Icons';

const createMarkup = (text: string) => {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-900/80 px-1.5 py-0.5 rounded-md text-sm text-teal-400 font-mono">$1</code>');
    
  return { __html: html };
};


const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [input, setInput] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t, locale } = useTranslation();

    // Initialize Chat and Welcome Message
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const systemInstruction = locale === 'en'
                ? `You are 'Meta Mind', an intelligent AI assistant specializing in the cryptocurrency market. 
                   Your expertise includes technical analysis, market trends, and explaining complex financial concepts.
                   When asked about recent events, news, or market data, use your search tool to provide the most accurate and up-to-date information.
                   You must always communicate in English. Be helpful, insightful, and concise.`
                : `Bạn là 'Meta Mind', một trợ lý AI thông minh chuyên về thị trường tiền điện tử. 
                   Chuyên môn của bạn bao gồm phân tích kỹ thuật, xu hướng thị trường, và giải thích các khái niệm tài chính phức tạp. 
                   Khi được hỏi về các sự kiện, tin tức hoặc dữ liệu thị trường gần đây, hãy sử dụng công cụ tìm kiếm của bạn để cung cấp thông tin chính xác và cập nhật nhất.
                   Bạn phải luôn giao tiếp bằng tiếng Việt. Hãy trả lời một cách hữu ích, sâu sắc và súc tích.`;
            
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction,
                    tools: [{googleSearch: {}}],
                },
            });
            setChat(newChat);
        } catch (error) {
            console.error("Error initializing AI Chat:", error);
            setMessages([{
                role: 'model',
                text: t('chatbot.error.init')
            }]);
        }
        
        setMessages([{
            role: 'model',
            text: t('chatbot.welcome')
        }]);

    }, [t, locale]);

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
            const groundingChunks = new Map<string, GroundingChunk>();
            setMessages(prev => [...prev, { role: 'model', text: '' }]); // Add empty model message

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                
                chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach(gc => {
                    if (gc.web?.uri) {
                        const typedGc = gc as GroundingChunk;
                        groundingChunks.set(typedGc.web.uri, typedGc);
                    }
                });

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }

            if (groundingChunks.size > 0) {
                 setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].groundingChunks = Array.from(groundingChunks.values());
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMsg = { role: 'model', text: t('chatbot.error.send') } as ChatMessage;
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                // If the last message was the empty placeholder, replace it. Otherwise, add a new one.
                if (lastMsg.role === 'model' && lastMsg.text === '') {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = errorMsg;
                    return newMessages;
                }
                return [...prev, errorMsg];
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Chat Window */}
            <div className={`
                ${isOpen ? 'animate-slide-in-bottom-right' : 'hidden'}
                w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[600px]
                flex flex-col glassmorphism rounded-xl shadow-2xl overflow-hidden
            `}>
                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-violet-500/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-teal-400" />
                        <h3 className="font-bold text-lg text-white">{t('chatbot.header')}</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-6 no-scrollbar">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-1">
                                    <CpuChipIcon className="w-5 h-5 text-teal-400" />
                                </div>
                            )}
                             <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2 rounded-2xl ${
                                    msg.role === 'user' 
                                    ? 'bg-violet-600 text-white rounded-br-none' 
                                    : 'bg-gray-800 text-gray-200 rounded-bl-none'
                                }`}>
                                    <div className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={createMarkup(msg.text)} />
                                </div>
                                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                    <div className="mt-2.5 text-xs text-gray-400 w-full">
                                        <div className="flex items-center gap-1.5 mb-1.5 font-semibold">
                                            <LinkIcon className="w-3.5 h-3.5"/>
                                            <span>{t('chatbot.sources')}</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5 pl-2 border-l border-gray-700">
                                        {msg.groundingChunks.map(chunk => (
                                            <a href={chunk.web.uri} key={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-400 transition-colors truncate">
                                                <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                                                <ArrowUpRightIcon className="w-3 h-3 flex-shrink-0"/>
                                            </a>
                                        ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-violet-800/80 flex items-center justify-center flex-shrink-0 mt-1">
                                    <UserCircleIcon className="w-5 h-5 text-violet-200" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && !messages.some(m => m.role === 'model' && m.text === '') && (
                         <div className="flex items-start gap-3 justify-start">
                             <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-1">
                                <CpuChipIcon className="w-5 h-5 text-teal-400" />
                             </div>
                             <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-gray-800 rounded-bl-none flex items-center">
                                 <div className="thinking-dots text-gray-400"></div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <footer className="p-4 bg-gray-900/50 border-t border-violet-500/30 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('chatbot.input.placeholder')}
                            disabled={isLoading}
                            className="w-full bg-gray-800 text-gray-100 placeholder-gray-500 px-4 py-2 rounded-full border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-2.5 text-white bg-teal-600 rounded-full hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </footer>
            </div>

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`
                    ${!isOpen ? 'block animate-pulse-shadow' : 'hidden'}
                    p-4 bg-gradient-to-r from-teal-500 to-violet-500 text-white rounded-full shadow-lg
                    hover:scale-110 hover:shadow-teal-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background-rgb))] focus:ring-teal-500
                    transition-all duration-200
                `}
                aria-label={t('chatbot.fab.label')}
            >
                <SparklesIcon className="w-10 h-10" />
            </button>
        </div>
    );
};

export default Chatbot;