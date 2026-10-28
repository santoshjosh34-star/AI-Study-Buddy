/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  KeyRound,
  FileText,
  ExternalLink,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ModelStatusResponse } from '../utils/studyLogic';

interface GemmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ModelStatusResponse | null;
}

export const GemmaModal: React.FC<GemmaModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemma-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 id="gemma-modal-title" className="text-base font-bold text-slate-900">
                Google Gemma Open-Weight Model Engine
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Transparent, open AI architecture for academic study assistance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Callout */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Current Model Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                status?.isGemmaAvailable
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {status?.isGemmaAvailable ? 'Active & Ready' : 'Setup Required'}
            </span>
          </div>
          <p>
            <strong>Preferred Model:</strong>{' '}
            <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-semibold">
              {status?.currentModel || 'gemma-4-26b-a4b-it'}
            </code>
          </p>
          <p className="text-slate-500 text-[11px]">
            {status?.message}
          </p>
        </div>

        {/* Why Gemma & Open-Weight Policy */}
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Strict Open-Weight Integrity Guarantee</span>
          </h3>
          <p>
            In compliance with our design constitution, this application uses Google's official hosted{' '}
            <strong className="text-slate-900">Gemma open-weight models</strong>. Unlike commercial chatbots, we do{' '}
            <span className="font-semibold underline">not</span> silently substitute Gemini or proprietary closed-weight models.
            If a Gemma model is not reachable in this account, the application will provide a clear diagnostic notification rather than masquerading.
          </p>
        </div>

        {/* Credentials & Privacy */}
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <span>Server-Side Credential Protection</span>
          </h3>
          <p>
            All AI reasoning requests are proxied securely through the Node.js Express server. API keys and secret tokens are never sent to your browser, rendered in HTML, or logged into client JavaScript bundles.
          </p>
        </div>

        {/* Licensing & Terms */}
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5">
          <h3 className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-700" />
            <span>Gemma Terms of Use & Academic Licensing</span>
          </h3>
          <p className="text-indigo-900">
            Gemma open models are built from the same research and technology used to create Gemini models. They are governed by the Google Gemma Terms of Use and Open Model License, granting broad academic and educational reuse rights for student learning and safety-aligned educational innovation.
          </p>
        </div>

        {/* Close Action */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
