/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  Zap,
} from 'lucide-react';
import { LanguageOption, getLanguageConfig } from '../utils/studyLogic';

interface SummaryCardProps {
  content: string;
  language: LanguageOption;
  model: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  content,
  language,
  model,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const langConfig = getLanguageConfig(language);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
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
    const cleanText = content.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
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
    element.download = `AI_Study_Buddy_Summary_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Formatted rendering
  const renderFormattedContent = () => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={index} className="h-2.5" />;
      }

      // Section Headings (⚡, 🔑, 📖, ⏰, or ###)
      if (
        trimmed.startsWith('###') ||
        trimmed.startsWith('##') ||
        trimmed.startsWith('#') ||
        /^[0-9]\.\s*[⚡🔑📖⏰]/.test(trimmed) ||
        /^[⚡🔑📖⏰]/.test(trimmed)
      ) {
        const cleanHeading = trimmed.replace(/^#+\s*/, '');
        return (
          <h4
            key={index}
            className="text-base font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-emerald-100 flex items-center space-x-2"
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

      // Numbered points
      if (/^[0-9]+\.\s+/.test(trimmed)) {
        return (
          <div key={index} className="text-sm font-medium text-slate-800 leading-relaxed my-1.5 ml-2">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          </div>
        );
      }

      // Paragraph
      return (
        <p key={index} className="text-sm text-slate-700 leading-relaxed my-1.5 font-normal">
          <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/60 px-4 py-3 sm:px-6 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Exam Revision Summary & High-Yield Points
            </h3>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-800">
                {langConfig.name}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-600">{model}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleToggleSpeech}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isSpeaking
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isSpeaking ? 'Stop Audio' : 'Listen Aloud'}
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-600" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Copy summary"
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

          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Download Summary as .txt"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 text-slate-800 leading-relaxed font-sans">
        {renderFormattedContent()}
      </div>
    </div>
  );
};

function formatInlineMarkdown(text: string): string {
  let res = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  res = res.replace(/`([^`]+)`/g, '<code class="bg-emerald-50 text-emerald-900 px-1 py-0.5 rounded font-mono text-xs font-semibold">$1</code>');

  return res;
}
