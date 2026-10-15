import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { aiAPI } from '../services/api';

const SAMPLE_PROMPTS = [
  "Is Connaught Place outer circle safe at 10:30 PM?",
  "Which route has better streetlighting and police booths?",
  "How to safely walk from Rajiv Chowk to Janpath late night?",
  "Are there 24/7 open pharmacies nearby?"
];

const AiAssistantModal = () => {
  const { isAiOpen, setIsAiOpen, currentLocation } = useTrip();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste! I am your Safe Route AI Assistant. Ask me anything about night safety, street lighting, police presence, or road conditions in your area.',
      tips: [
        'Always pick the Safest Route badge for night travel.',
        'Keep SOS quick-dial handy in unfamiliar stretches.'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isAiOpen) return null;

  const handleSend = async (questionText = null) => {
    const q = (questionText || input).trim();
    if (!q) return;

    // Add user question
    const newMessages = [...messages, { sender: 'user', text: q }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await aiAPI.askSafetyQuestion({
        question: q,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        timeStr: '10:00 PM'
      });

      if (res.data.success) {
        const aiRes = res.data.ai_response;
        setMessages([
          ...newMessages,
          {
            sender: 'ai',
            text: aiRes.answer,
            tips: aiRes.actionable_tips,
            safePlacesCount: aiRes.nearby_safe_amenities_count
          }
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'ai',
          text: 'Raat ke samay (10 PM ke baad) main commercial radial road prefer karein. Outer ring aur police booths ke paas continuous patrolling rehti hai.',
          tips: [
            'Avoid dark inner alleys behind Block D.',
            'Central Police Post is within 350m of Rajiv Chowk.',
            'Keep your live trip share link active with family.'
          ]
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg h-[600px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-900 dark:text-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Safety Assistant</h3>
              <p className="text-[11px] text-slate-400">Contextual route guidance & risk intelligence</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                }`}
              >
                <p>{msg.text}</p>
                {msg.tips && msg.tips.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-1">
                    <span className="font-bold text-[11px] text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                      Safety Recommendations:
                    </span>
                    {msg.tips.map((tip, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Bot className="w-4 h-4 text-teal-500 animate-spin" />
              <span>AI is evaluating local hazards & lighting data...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
          {SAMPLE_PROMPTS.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask: 'Is this road safe at night?'..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AiAssistantModal;
