/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Trash2, Cpu, GraduationCap, Users, Clock, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

type TutorPersona = 'prof' | 'peer' | 'coach';

const PERSONAS: Record<TutorPersona, { name: string; title: string; icon: any; system: string; color: string }> = {
  prof: {
    name: 'Prof. Bennett',
    title: 'Socratic Academic Mentor',
    icon: GraduationCap,
    color: 'from-indigo-500 to-sky-600',
    system:
      'You are Professor Bennett, an inspiring college professor. Use the Socratic method, provide illuminating real-world analogies, breaking complex concepts into intuitive first principles. Encourage critical thinking.',
  },
  peer: {
    name: 'Alex',
    title: 'Senior Study Partner',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    system:
      'You are Alex, an enthusiastic high-achieving senior college student and study buddy. Speak in a friendly, encouraging peer voice. Use memorable mnemonics, exam shortcuts, and practical study hacks.',
  },
  coach: {
    name: 'Coach Maya',
    title: 'Exam Drill Master',
    icon: Clock,
    color: 'from-amber-500 to-rose-600',
    system:
      'You are Coach Maya, an intensive exam preparation coach. Challenge the student with quick practice drills, analyze edge cases, highlight common exam traps, and keep answers laser-focused for maximum points.',
  },
};

const SUGGESTED_PROMPTS = [
  'Explain Dijkstra’s shortest path algorithm step-by-step',
  'What is the difference between TCP and UDP with real-life examples?',
  'How do I remember the stages of Mitosis easily?',
  'Give me 3 practice problems on Bayes Theorem',
];

export const StudyChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: "Hi there! I'm your AI Study Chatbot. Ask me any question from your lectures, syllabus, or exam prep!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<TutorPersona>('prof');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon'>('gemini-3.1-flash-lite');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isLoading) return;

    setInputText('');
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Map history for Gemini API ({ role: 'user' | 'model', text: string })
      const payloadMessages = newHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const persona = PERSONAS[selectedPersona];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: selectedModel,
          systemInstruction: persona.system,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to receive response from Gemini chatbot.');
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Error communicating with Gemini model.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: String(Date.now()),
        role: 'model',
        text: `Chat reset! Let's study something new with ${PERSONAS[selectedPersona].name}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const currentPersona = PERSONAS[selectedPersona];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Persona info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentPersona.color} flex items-center justify-center text-white shadow-md`}
          >
            <currentPersona.icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{currentPersona.name}</h2>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                {currentPersona.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Multi-turn college tutoring with role memory</p>
          </div>
        </div>

        {/* Right: Persona & Model Pickers */}
        <div className="flex items-center gap-2 text-xs">
          {/* Persona picker */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            {(Object.keys(PERSONAS) as TutorPersona[]).map((key) => {
              const p = PERSONAS[key];
              const Icon = p.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPersona(key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition ${
                    selectedPersona === key
                      ? 'bg-slate-700 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={p.title}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Model picker */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (Balanced)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
            <option value="gemini-4-argon">gemini-4-argon (Complex reasoning)</option>
          </select>

          <button
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notice if gemini-4-argon is picked */}
      {selectedModel === 'gemini-4-argon' && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/40 text-[11px] text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>
            Note: <strong>gemini-4-argon</strong> requires a billing-enabled API key. If requests encounter errors, switch to free-tier <strong>gemini-3.8-flash</strong> or <strong>gemini-3.1-flash-lite</strong>.
          </span>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'model' && (
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentPersona.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5`}
              >
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white shadow-md rounded-br-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-sm rounded-bl-none'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">
                  {m.role === 'user' ? 'You' : currentPersona.name}
                </span>
                <span>{m.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentPersona.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5 animate-pulse`}
            >
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <span>Thinking with {selectedModel}...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Prompts */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex-shrink-0">
          Try:
        </span>
        {SUGGESTED_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] transition flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask ${currentPersona.name} any study question...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
