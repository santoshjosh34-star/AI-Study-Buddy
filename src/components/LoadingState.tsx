/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, CheckSquare, Sparkles, Cpu } from 'lucide-react';
import { StudyAction, LanguageOption, getLanguageConfig } from '../utils/studyLogic';

interface LoadingStateProps {
  action: StudyAction;
  language: LanguageOption;
  modelName: string;
}

const STUDY_QUOTES = [
  '“Study without desire spoils the memory, and it retains nothing that it takes in.” — Leonardo da Vinci',
  '“Success is the sum of small efforts, repeated day in and day out.” — Robert Collier',
  '“The secret of getting ahead is getting started.” — Mark Twain',
  '“Live as if you were to die tomorrow. Learn as if you were to live forever.” — Mahatma Gandhi',
];

export const LoadingState: React.FC<LoadingStateProps> = ({
  action,
  language,
  modelName,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const langConfig = getLanguageConfig(language);

  const steps =
    action === 'quiz'
      ? [
          'Analyzing note key concepts and core definitions...',
          'Drafting college-level exam questions...',
          `Formulating multiple choices & explanations in ${langConfig.name}...`,
          `Finalizing structured JSON output via ${modelName}...`,
        ]
      : action === 'summarize'
      ? [
          'Scanning syllabus notes and identifying high-yield points...',
          'Extracting essential formulas, terms, and takeaways...',
          `Structuring high-impact revision bullet points in ${langConfig.name}...`,
          `Polishing summary with ${modelName}...`,
        ]
      : [
          'Parsing your study notes and identifying key jargon...',
          'Drafting step-by-step conceptual breakdowns...',
          `Crafting intuitive real-world college analogies in ${langConfig.name}...`,
          `Generating final explanation with ${modelName}...`,
        ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 2200);

    const quoteTimer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % STUDY_QUOTES.length);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(quoteTimer);
    };
  }, [steps.length]);

  const getActionDetails = () => {
    switch (action) {
      case 'explain':
        return {
          title: 'Explaining Your Notes',
          icon: <BookOpen className="h-6 w-6 text-indigo-600 animate-bounce" />,
          bgColor: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        };
      case 'summarize':
        return {
          title: 'Summarizing Core Points',
          icon: <FileText className="h-6 w-6 text-emerald-600 animate-bounce" />,
          bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        };
      case 'quiz':
        return {
          title: 'Generating Practice Quiz',
          icon: <CheckSquare className="h-6 w-6 text-amber-600 animate-bounce" />,
          bgColor: 'bg-amber-50 border-amber-200 text-amber-900',
        };
    }
  };

  const details = getActionDetails();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-xs animate-fadeIn">
      {/* Icon badge */}
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner">
          {details.icon}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <h3 className="text-lg font-bold text-slate-900">{details.title}</h3>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Cpu className="h-3 w-3" />
            <span>{modelName}</span>
          </span>
        </div>
        <p className="text-sm text-slate-600 font-medium h-6 transition-all duration-300">
          {steps[stepIndex]}
        </p>
      </div>

      {/* Progress Bar Animation */}
      <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 h-full rounded-full animate-pulse w-full" />
      </div>

      {/* Motivational Quote */}
      <div className="pt-4 border-t border-slate-100 max-w-lg mx-auto">
        <p className="text-xs italic text-slate-500">
          {STUDY_QUOTES[quoteIndex]}
        </p>
      </div>
    </div>
  );
};
