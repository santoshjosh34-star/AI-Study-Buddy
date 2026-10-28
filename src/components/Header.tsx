/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap, Sparkles, Cpu, Info, ShieldCheck } from 'lucide-react';
import { ModelStatusResponse } from '../utils/studyLogic';

interface HeaderProps {
  modelStatus: ModelStatusResponse | null;
  onOpenModelInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ modelStatus, onOpenModelInfo }) => {
  const isAvailable = modelStatus?.isGemmaAvailable;
  const currentModel = modelStatus?.currentModel || 'gemma-4-26b-a4b-it';

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-50">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                AI Study Buddy
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                College Edition
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium hidden sm:block">
              Interactive exam prep & notes breakdown in Simple English & Telugu-English
            </p>
          </div>
        </div>

        {/* Gemma Model Status Badge & Info button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenModelInfo}
            aria-label="View Google Gemma open-weight model details"
            className="group flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isAvailable
                  ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                  : 'bg-amber-500 ring-4 ring-amber-100'
              }`}
            />
            <div className="flex items-center space-x-1.5">
              <Cpu className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800">
                {currentModel}
              </span>
              <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                Open-Weight
              </span>
            </div>
            <Info className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
