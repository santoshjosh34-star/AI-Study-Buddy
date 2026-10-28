/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Languages, HelpCircle, Check, Sparkles, Globe2, BookA } from 'lucide-react';
import {
  LanguageOption,
  LANGUAGE_CONFIGS,
  LanguageConfig,
  getLanguageConfig,
} from '../utils/studyLogic';

interface LanguageSelectorProps {
  language: LanguageOption;
  onChange: (lang: LanguageOption) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onChange,
  disabled = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'All' | 'Bilingual (Latin Script)' | 'Native Script' | 'International'
  >('All');

  const selectedConfig = getLanguageConfig(language);

  const categories = [
    'All',
    'Bilingual (Latin Script)',
    'Native Script',
    'International',
  ] as const;

  const filteredLanguages =
    activeCategory === 'All'
      ? LANGUAGE_CONFIGS
      : LANGUAGE_CONFIGS.filter((l) => l.category === activeCategory);

  return (
    <div className="space-y-3">
      {/* Header and Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <Languages className="h-4 w-4 text-indigo-600" />
            <span>Output Explanation Language ({LANGUAGE_CONFIGS.length} Supported)</span>
          </label>
          <p className="text-xs text-slate-700 font-medium">
            Select your preferred study and exam revision explanation language
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center flex-wrap gap-1 text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              disabled={disabled}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Languages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredLanguages.map((item: LanguageConfig) => {
          const isSelected = language === item.id;

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              aria-pressed={isSelected}
              className={`flex flex-col justify-between p-3 rounded-xl border text-left transition cursor-pointer relative ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${item.badgeClass}`}
                  >
                    {item.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed pl-5 line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Sample preview phrase */}
              <div className="mt-2.5 pt-1.5 border-t border-slate-100 pl-5 text-[10px] text-slate-600 font-mono italic truncate">
                e.g. "{item.sample}"
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Language Context Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50/80 to-sky-50/60 border border-indigo-100 text-slate-700 text-xs flex items-start space-x-2.5">
        <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900">
            Selected: <span className="text-indigo-700 font-bold">{selectedConfig.name}</span>{' '}
            <span className="text-[10px] text-slate-500 font-normal">({selectedConfig.category})</span>
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {selectedConfig.category === 'Bilingual (Latin Script)' ? (
              <>
                <strong>Bilingual Exam Formula:</strong> Conversational regional phrasing written in Latin letters, keeping core university definitions, variable names, and formulas in English for high exam scoring.
              </>
            ) : selectedConfig.category === 'Native Script' ? (
              <>
                <strong>Native Typography:</strong> Beautiful native script explanation with key technical terms preserved for academic accuracy.
              </>
            ) : (
              <>
                <strong>Clear Academic Style:</strong> Plain, beginner-friendly phrasing with intuitive analogies to clarify complex topics.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
