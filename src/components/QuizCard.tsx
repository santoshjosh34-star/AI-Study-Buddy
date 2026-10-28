/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  HelpCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  QuizQuestion,
  QuizResult,
  calculateQuizScore,
  LanguageOption,
  getLanguageConfig,
} from '../utils/studyLogic';

interface QuizCardProps {
  questions: QuizQuestion[];
  language: LanguageOption;
  model: string;
  onRegenerate: () => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export const QuizCard: React.FC<QuizCardProps> = ({
  questions,
  language,
  model,
  onRegenerate,
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const allAnswered = answeredCount === totalQuestions;

  const scoreResult: QuizResult = calculateQuizScore(userAnswers, questions);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden animate-fadeIn space-y-0">
      {/* Quiz Header Bar */}
      <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/60 px-4 py-3 sm:px-6 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <CheckSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Interactive College Practice Quiz
            </h3>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="font-semibold text-amber-800">
                {getLanguageConfig(language).name}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-600">{model}</span>
              <span>•</span>
              <span>{totalQuestions} Questions</span>
            </div>
          </div>
        </div>

        {/* Progress & Quick Reset */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-amber-200 text-amber-900 shadow-2xs">
            Answered: {answeredCount} / {totalQuestions}
          </span>
          <button
            type="button"
            onClick={handleResetQuiz}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition cursor-pointer"
            title="Reset Quiz Answers"
            aria-label="Reset Quiz Answers"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Score Banner when questions answered */}
      {answeredCount > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base border border-indigo-200 shrink-0">
              {scoreResult.grade}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900">
                  Current Score: {scoreResult.score} / {scoreResult.total} ({scoreResult.percentage}%)
                </span>
                {allAnswered && (
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      scoreResult.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {scoreResult.passed ? 'Passed' : 'Needs Review'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {scoreResult.feedback}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleResetQuiz}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Clear & Retake
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer shadow-2xs"
            >
              Generate New Questions
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="p-4 sm:p-6 space-y-6">
        {questions.map((q, qIndex) => {
          const selectedOption = userAnswers[q.id];
          const isAnswered = selectedOption !== undefined;
          const isCorrect = isAnswered && selectedOption === q.correctIndex;

          return (
            <div
              key={q.id || qIndex}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Question text & status badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start space-x-2.5">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    {q.question}
                  </h4>
                </div>

                {/* Outcome indicator badge */}
                {isAnswered && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Correct</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selectedOption === optIdx;
                  const isThisCorrectAnswer = optIdx === q.correctIndex;

                  let optClass =
                    'border-slate-200 bg-slate-50/40 hover:bg-slate-100/70 text-slate-800';

                  if (isAnswered) {
                    if (isThisCorrectAnswer) {
                      optClass =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30 font-medium';
                    } else if (isThisSelected && !isThisCorrectAnswer) {
                      optClass =
                        'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/30 line-through opacity-90';
                    } else {
                      optClass = 'border-slate-200 bg-slate-50/30 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`flex items-start p-3 rounded-xl border text-left text-xs sm:text-sm transition cursor-pointer ${optClass}`}
                    >
                      <span
                        className={`h-5 w-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 mr-2.5 ${
                          isAnswered && isThisCorrectAnswer
                            ? 'bg-emerald-600 text-white'
                            : isAnswered && isThisSelected && !isThisCorrectAnswer
                            ? 'bg-rose-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        {OPTION_LABELS[optIdx]}
                      </span>
                      <span className="leading-snug pt-0.5">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Pedagogical Explanation Card */}
              {isAnswered && (
                <div
                  className={`mt-4 p-3.5 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                    isCorrect
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600" />
                    <div>
                      <p className="font-bold mb-1">
                        Explanation ({OPTION_LABELS[q.correctIndex]} is correct):
                      </p>
                      <p>{q.explanation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
