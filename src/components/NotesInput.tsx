/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  FileText,
  CheckSquare,
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import {
  SAMPLE_TOPICS,
  SampleTopic,
  MAX_NOTES_LENGTH,
  StudyAction,
} from '../utils/studyLogic';

interface NotesInputProps {
  notes: string;
  onNotesChange: (val: string) => void;
  charCount: number;
  wordCount: number;
  validationError: string | null;
  isLoading: boolean;
  activeAction: StudyAction | null;
  onAction: (action: StudyAction) => void;
  onReset: () => void;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  notes,
  onNotesChange,
  charCount,
  wordCount,
  validationError,
  isLoading,
  activeAction,
  onAction,
  onReset,
}) => {
  const isOverLimit = charCount > MAX_NOTES_LENGTH;
  const isNearLimit = charCount > MAX_NOTES_LENGTH * 0.9;

  const handleSelectSample = (sample: SampleTopic) => {
    onNotesChange(sample.content);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header and Quick Samples */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <label
            htmlFor="study-notes-textarea"
            className="text-sm font-bold text-slate-900 flex items-center space-x-1.5"
          >
            <span>Your Study Notes / Syllabus Topic</span>
          </label>
          <p className="text-xs text-slate-700 font-medium">
            Paste lecture notes, textbook excerpts, or choose a college demo topic below
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span
            className={`px-2 py-0.5 rounded-md font-semibold border ${
              isOverLimit
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : isNearLimit
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {charCount.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()} chars
          </span>
          <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline">
            {wordCount.toLocaleString()} words
          </span>
        </div>
      </div>

      {/* College Demo Samples Pills */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Quick College Demo Topics (Click to Load):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_TOPICS.map((topic) => (
            <button
              key={topic.title}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelectSample(topic)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/40 text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {topic.title}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Textarea */}
      <div className="relative">
        <textarea
          id="study-notes-textarea"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Type or paste your college notes here (e.g. Operating Systems scheduling, DBMS transactions, networking protocols, biology genetics, microeconomics concepts)..."
          rows={7}
          disabled={isLoading}
          aria-invalid={!!validationError || isOverLimit}
          aria-describedby={validationError ? 'notes-validation-error' : undefined}
          className={`w-full text-sm rounded-xl p-3.5 border transition font-normal focus:outline-hidden resize-y ${
            validationError || isOverLimit
              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
              : 'border-slate-300 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20'
          } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Inline Validation Alert */}
      {validationError && (
        <div
          id="notes-validation-error"
          role="alert"
          className="flex items-center space-x-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 animate-fadeIn"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
          {/* Action 1: Explain Notes */}
          <button
            type="button"
            disabled={isLoading || isOverLimit}
            onClick={() => onAction('explain')}
            className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition shadow-sm cursor-pointer ${
              activeAction === 'explain' && isLoading
                ? 'bg-indigo-700 ring-2 ring-indigo-400'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            } ${isLoading || isOverLimit ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Explain Notes</span>
          </button>

          {/* Action 2: Summarize Notes */}
          <button
            type="button"
            disabled={isLoading || isOverLimit}
            onClick={() => onAction('summarize')}
            className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition shadow-sm cursor-pointer ${
              activeAction === 'summarize' && isLoading
                ? 'bg-emerald-700 ring-2 ring-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            } ${isLoading || isOverLimit ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>Summarize Notes</span>
          </button>

          {/* Action 3: Generate Quiz */}
          <button
            type="button"
            disabled={isLoading || isOverLimit}
            onClick={() => onAction('quiz')}
            className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition shadow-sm cursor-pointer ${
              activeAction === 'quiz' && isLoading
                ? 'bg-amber-700 ring-2 ring-amber-400'
                : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
            } ${isLoading || isOverLimit ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span>Generate Quiz</span>
          </button>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading || (!notes && !validationError)}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
