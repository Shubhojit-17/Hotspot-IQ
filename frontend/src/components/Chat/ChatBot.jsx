import React, { useState, useRef, useEffect } from 'react';
import { chat } from '../../services/api';

export const ChatBot = ({ selectedLocation, businessType, analysis, isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m Hotspot IQ. I can help you analyze locations and answer questions about your business expansion. How can I help you today?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const context = {
                lat: selectedLocation?.lat,
                lng: selectedLocation?.lng,
                business_type: businessType,
                analysis_data: analysis
            };

            const response = await chat(userMessage, context);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.response,
                isAi: response.ai_powered
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again later.',
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Chat Window */}
            <div className="relative w-full max-w-lg h-[600px] glass-panel flex flex-col shadow-2xl animate-in zoom-in-95 fade-in duration-200 mx-4">
                {/* Header */}
                <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-elevated/50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <h3 className="font-semibold text-white">Hotspot IQ Assistant</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`
                max-w-[80%] p-3 rounded-2xl text-sm
                ${msg.role === 'user'
                                        ? 'bg-primary-glow/20 text-white rounded-tr-sm border border-primary-glow/30'
                                        : 'bg-surface-elevated text-slate-200 rounded-tl-sm border border-surface-border'
                                    }
                ${msg.isError ? 'border-destructive-glow/50 text-destructive-glow' : ''}
              `}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                {msg.isAi && (
                                    <div className="mt-1 flex items-center gap-1 opacity-50">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="text-[10px]">AI Powered</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-surface-elevated p-3 rounded-2xl rounded-tl-sm border border-surface-border">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-surface-border bg-surface-elevated/30">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about this location..."
                            className="w-full bg-surface-base border border-surface-border rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-glow focus:ring-1 focus:ring-primary-glow transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-glow hover:text-white disabled:opacity-50 disabled:hover:text-primary-glow transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
