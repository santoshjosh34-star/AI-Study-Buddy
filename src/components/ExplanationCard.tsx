/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Sparkles,
} from 'lucide-react';
import { LanguageOption, getLanguageConfig } from '../utils/studyLogic';

interface ExplanationCardProps {
  content: string;
  language: LanguageOption;
  model: string;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  content,
  language,
  model,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<1 | 1.2>(1);

  // Stop speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const langConfig = getLanguageConfig(language);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown hashes/asterisks for cleaner audio
    const cleanText = content.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.lang = langConfig.ttsLang;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `AI_Study_Buddy_Explanation_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Render nicely formatted paragraphs and headings
  const renderFormattedContent = () => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={index} className="h-3" />;
      }

      // Main Headings (###, ##, or emoji section titles like 📌, 🔍, 💡, 🎯)
      if (
        trimmed.startsWith('###') ||
        trimmed.startsWith('##') ||
        trimmed.startsWith('#') ||
        /^[0-9]\.\s*[📌🔍💡🎯]/.test(trimmed) ||
        /^[📌🔍💡🎯]/.test(trimmed)
      ) {
        const cleanHeading = trimmed.replace(/^#+\s*/, '');
        return (
          <h4
            key={index}
            className="text-base sm:text-lg font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-indigo-100 flex items-center space-x-2"
          >
            <span>{cleanHeading}</span>
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s*/, '');
        return (
          <li key={index} className="ml-5 list-disc text-sm text-slate-700 leading-relaxed my-1">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
          </li>
        );
      }

      // Numbered items
      if (/^[0-9]+\.\s+/.test(trimmed)) {
        return (
          <div key={index} className="text-sm font-medium text-slate-800 leading-relaxed my-1.5 ml-2">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={index} className="text-sm text-slate-700 leading-relaxed my-2 font-normal">
          <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-50/80 to-sky-50/60 px-4 py-3 sm:px-6 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Concept Breakdown & Explanation
            </h3>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="font-semibold text-indigo-700">
                {langConfig.name}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-600">{model}</span>
            </div>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Audio Speech Button */}
          <button
            onClick={handleToggleSpeech}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isSpeaking
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isSpeaking ? 'Stop Audio' : 'Listen Aloud'}
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-indigo-600" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-600" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Download Notes as .txt"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Formatted Content Body */}
      <div className="p-4 sm:p-6 text-slate-800 leading-relaxed font-sans">
        {renderFormattedContent()}
      </div>
    </div>
  );
};

/**
 * Basic inline markdown bold/code highlights helper
 */
function formatInlineMarkdown(text: string): string {
  let res = text
    // escape html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text** or __text__
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  // Inline code: `text`
  res = res.replace(/`([^`]+)`/g, '<code class="bg-indigo-50 text-indigo-800 px-1 py-0.5 rounded font-mono text-xs font-semibold">$1</code>');

  return res;
}
