/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Sparkles,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { ModelStatusResponse } from '../utils/studyLogic';

interface ModelBannerProps {
  status: ModelStatusResponse | null;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onRefresh: () => void;
  isLoadingStatus: boolean;
  onOpenModelInfo: () => void;
}

export const ModelBanner: React.FC<ModelBannerProps> = ({
  status,
  selectedModel,
  onSelectModel,
  onRefresh,
  isLoadingStatus,
  onOpenModelInfo,
}) => {
  if (!status) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-center justify-between animate-pulse">
        <span>Connecting to Google Gemma open-weight model environment...</span>
      </div>
    );
  }

  // Case 1: Missing API Key
  if (!status.isKeyConfigured) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 shadow-xs mb-6">
        <div className="flex items-start space-x-3">
          <KeyRound className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <h2 className="text-sm font-bold text-amber-950">
              API Key Setup Required for Gemma Open-Weight Model
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              AI Study Buddy requires a server-side API secret to interact with Google's hosted{' '}
              <strong className="font-semibold text-amber-950">Gemma open-weight models</strong> (
              <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">gemma-4-26b-a4b-it</code>).
              To protect your credentials, API keys are kept strictly on the server and never exposed to the client.
            </p>
            <div className="bg-white/80 border border-amber-200 rounded-xl p-3 mt-2 text-xs space-y-1 text-slate-700">
              <p className="font-semibold text-slate-900">How to configure:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
                <li>Open the <span className="font-medium">Settings</span> panel in the AI Studio sidebar.</li>
                <li>Navigate to <span className="font-medium">Secrets</span>.</li>
                <li>Add a secret named <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold text-indigo-700">GEMINI_API_KEY</code> with your Google AI Studio API key.</li>
                <li>Click the <span className="font-medium">"Refresh Status"</span> button below.</li>
              </ol>
            </div>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={onRefresh}
                disabled={isLoadingStatus}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                <span>{isLoadingStatus ? 'Checking...' : 'Refresh Status'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Gemma Model is unavailable in this account
  if (!status.isGemmaAvailable) {
    return (
      <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-rose-900 shadow-xs mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <h2 className="text-sm font-bold text-rose-950">
              Gemma Open-Weight Model Unavailable
            </h2>
            <p className="text-xs text-rose-800 leading-relaxed">
              Per requirements, this application strictly integrates Google's hosted{' '}
              <strong className="font-semibold text-rose-950">Gemma open-weight models</strong> (preferring{' '}
              <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">gemma-4-26b-a4b-it</code>) and does{' '}
              <span className="font-semibold underline">not</span> silently substitute closed-weight models.
            </p>
            <p className="text-xs text-rose-700">
              {status.message}
            </p>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={onRefresh}
                disabled={isLoadingStatus}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                <span>Check Again</span>
              </button>
              <button
                onClick={onOpenModelInfo}
                className="text-xs font-medium text-rose-800 hover:text-rose-950 underline cursor-pointer"
              >
                View Gemma Model Architecture & Setup Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Gemma is active and ready!
  return (
    <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-emerald-50/60 border border-indigo-100/80 rounded-2xl p-3.5 sm:p-4 mb-6 text-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                Active Open-Weight Engine:
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>{selectedModel}</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                Hosted Gemma
              </span>
            </div>
            <p className="text-[11px] text-slate-700 mt-0.5 font-medium">
              Authentic open-weight reasoning. Zero closed-weight substitution. All AI execution on secure server.
            </p>
          </div>
        </div>

        {/* Available model selector if multiple Gemma models exist */}
        <div className="flex items-center space-x-2 shrink-0">
          {status.availableGemmaModels.length > 1 && (
            <div className="flex items-center space-x-1">
              <label htmlFor="model-select" className="text-xs text-slate-500 hidden sm:inline">
                Model:
              </label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {status.availableGemmaModels.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 'gemma-4-26b-a4b-it' ? '(Preferred)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onRefresh}
            title="Refresh Gemma model status"
            disabled={isLoadingStatus}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200/80 transition cursor-pointer"
            aria-label="Refresh model status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
