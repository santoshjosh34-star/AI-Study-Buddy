/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap, ShieldCheck, Heart, Cpu } from 'lucide-react';

interface FooterProps {
  onOpenModelInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModelInfo }) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-slate-500 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">AI Study Buddy</span>
          <span>•</span>
          <span>College Academic Assistant</span>
        </div>

        <div className="flex items-center space-x-4 text-slate-500">
          <button
            onClick={onOpenModelInfo}
            className="hover:text-indigo-600 transition flex items-center space-x-1 cursor-pointer"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Google Gemma Open-Weight Model</span>
          </button>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Secure Server Proxy</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Built for College Students • Simple English & Telugu-English
        </div>
      </div>
    </footer>
  );
};
