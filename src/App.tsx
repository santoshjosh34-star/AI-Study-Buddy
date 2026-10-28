/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ModelBanner } from './components/ModelBanner';
import { LanguageSelector } from './components/LanguageSelector';
import { NotesInput } from './components/NotesInput';
import { LoadingState } from './components/LoadingState';
import { ExplanationCard } from './components/ExplanationCard';
import { SummaryCard } from './components/SummaryCard';
import { QuizCard } from './components/QuizCard';
import { GemmaModal } from './components/GemmaModal';
import { Footer } from './components/Footer';
import { CampusArcadeGame } from './components/CampusArcadeGame';
import { LiveVoiceTutor } from './components/LiveVoiceTutor';
import { LectureTranscriber } from './components/LectureTranscriber';
import { StudyChatbot } from './components/StudyChatbot';
import { VideoStudio } from './components/VideoStudio';
import {
  LanguageOption,
  StudyAction,
  QuizQuestion,
  ModelStatusResponse,
  validateNotes,
} from './utils/studyLogic';
import {
  AlertCircle,
  RefreshCw,
  Sparkles,
  BookOpen,
  MessageSquare,
  Mic,
  FileAudio,
  Film,
  Gamepad2,
} from 'lucide-react';

export type ActiveTab = 'notes' | 'chat' | 'voice' | 'transcribe' | 'video' | 'game';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('notes');
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState<LanguageOption>('simple-english');
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemma-4-26b-a4b-it');
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // AI execution states
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<StudyAction | null>(null);
  const [lastAction, setLastAction] = useState<StudyAction | null>(null);

  // Results
  const [explanation, setExplanation] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);

  // Errors
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Character and word count
  const charCount = notes.length;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).filter(Boolean).length : 0;

  // Fetch model status on initial mount
  const fetchModelStatus = async (forceRefresh = false) => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch(`/api/status${forceRefresh ? '?refresh=true' : ''}`);
      const data: ModelStatusResponse = await res.json();
      setModelStatus(data);
      if (data.currentModel) {
        setSelectedModel(data.currentModel);
      }
    } catch (err: any) {
      console.error('Failed to query /api/status:', err);
      setModelStatus({
        isKeyConfigured: false,
        isGemmaAvailable: false,
        currentModel: 'gemma-4-26b-a4b-it',
        availableGemmaModels: [],
        isOpenWeight: true,
        message: 'Could not connect to study server. Please verify network connectivity.',
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchModelStatus();
  }, []);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (validationError) {
      setValidationError(null);
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handleReset = () => {
    setNotes('');
    setExplanation(null);
    setSummary(null);
    setQuizQuestions(null);
    setActiveAction(null);
    setLastAction(null);
    setValidationError(null);
    setApiError(null);
  };

  const handleInsertTranscribedNotes = (transcribedText: string) => {
    setNotes((prev) => (prev.trim() ? `${prev}\n\n${transcribedText}` : transcribedText));
    setActiveTab('notes');
  };

  const handleAction = async (action: StudyAction) => {
    setValidationError(null);
    setApiError(null);

    // Validate notes
    const validation = validateNotes(notes);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Please enter study notes first.');
      return;
    }

    setIsLoading(true);
    setActiveAction(action);

    // Smooth scroll down to results section after short delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      let endpoint = '';
      if (action === 'explain') endpoint = '/api/study/explain';
      else if (action === 'summarize') endpoint = '/api/study/summarize';
      else if (action === 'quiz') endpoint = '/api/study/quiz';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          language,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'The Gemma server encountered an error processing your notes.');
      }

      setLastAction(action);

      if (action === 'explain') {
        setExplanation(data.explanation);
        setSummary(null);
        setQuizQuestions(null);
      } else if (action === 'summarize') {
        setSummary(data.summary);
        setExplanation(null);
        setQuizQuestions(null);
      } else if (action === 'quiz') {
        setQuizQuestions(data.quiz);
        setExplanation(null);
        setSummary(null);
      }
    } catch (err: any) {
      console.error('Study action error:', err);
      setApiError(err.message || 'Something went wrong while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const TABS = [
    { id: 'notes', label: 'Study Workspace', icon: BookOpen, badge: 'Gemma 4' },
    { id: 'chat', label: 'AI Study Chat', icon: MessageSquare, badge: 'Gemini 3.8' },
    { id: 'voice', label: 'Live Voice Tutor', icon: Mic, badge: 'Live API' },
    { id: 'transcribe', label: 'Lecture Transcriber', icon: FileAudio, badge: 'Gemini 3.5' },
    { id: 'video', label: 'Video Studio', icon: Film, badge: 'Omni Flash' },
    { id: 'game', label: 'Campus Arcade', icon: Gamepad2, badge: '60 FPS' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <Header
        modelStatus={modelStatus}
        onOpenModelInfo={() => setIsModalOpen(true)}
      />

      {/* Navigation Feature Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-indigo-700/80 text-indigo-100'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* TAB 1: STUDY WORKSPACE (GEMMA 4) */}
        {activeTab === 'notes' && (
          <>
            {/* Gemma Open-Weight Model Status Banner */}
            <ModelBanner
              status={modelStatus}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              onRefresh={() => fetchModelStatus(true)}
              isLoadingStatus={isLoadingStatus}
              onOpenModelInfo={() => setIsModalOpen(true)}
            />

            {/* Input Card Container */}
            <div className="space-y-6">
              {/* Language Selector */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <LanguageSelector
                  language={language}
                  onChange={setLanguage}
                  disabled={isLoading}
                />
              </div>

              {/* Notes Input & Action Controls */}
              <NotesInput
                notes={notes}
                onNotesChange={handleNotesChange}
                charCount={charCount}
                wordCount={wordCount}
                validationError={validationError}
                isLoading={isLoading}
                activeAction={activeAction}
                onAction={handleAction}
                onReset={handleReset}
              />
            </div>

            {/* API Error Notification */}
            {apiError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm space-y-2 shadow-xs animate-fadeIn"
              >
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-rose-950">AI Study Request Error</h4>
                    <p className="text-xs text-rose-800 leading-relaxed">{apiError}</p>
                    <div className="pt-1 flex items-center space-x-2">
                      <button
                        onClick={() => lastAction && handleAction(lastAction)}
                        className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Try Again</span>
                      </button>
                      <button
                        onClick={() => setApiError(null)}
                        className="text-xs font-medium text-rose-700 hover:text-rose-900 underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results / Loading Anchor */}
            <div ref={resultsRef} className="pt-2">
              {isLoading && activeAction && (
                <LoadingState
                  action={activeAction}
                  language={language}
                  modelName={selectedModel}
                />
              )}

              {!isLoading && lastAction === 'explain' && explanation && (
                <ExplanationCard
                  content={explanation}
                  language={language}
                  model={selectedModel}
                />
              )}

              {!isLoading && lastAction === 'summarize' && summary && (
                <SummaryCard
                  content={summary}
                  language={language}
                  model={selectedModel}
                />
              )}

              {!isLoading && lastAction === 'quiz' && quizQuestions && (
                <QuizCard
                  questions={quizQuestions}
                  language={language}
                  model={selectedModel}
                  onRegenerate={() => handleAction('quiz')}
                />
              )}
            </div>
          </>
        )}

        {/* TAB 2: AI STUDY CHAT */}
        {activeTab === 'chat' && <StudyChatbot />}

        {/* TAB 3: LIVE VOICE TUTOR */}
        {activeTab === 'voice' && <LiveVoiceTutor />}

        {/* TAB 4: LECTURE AUDIO TRANSCRIBER */}
        {activeTab === 'transcribe' && (
          <LectureTranscriber onInsertIntoNotes={handleInsertTranscribedNotes} />
        )}

        {/* TAB 5: CONCEPT VIDEO STUDIO */}
        {activeTab === 'video' && <VideoStudio />}

        {/* TAB 6: CAMPUS ARCADE GAME */}
        {activeTab === 'game' && (
          <CampusArcadeGame onBackToNotes={() => setActiveTab('notes')} />
        )}
      </main>

      {/* Gemma Information Dialog */}
      <GemmaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={modelStatus}
      />

      {/* Footer */}
      <Footer onOpenModelInfo={() => setIsModalOpen(true)} />
    </div>
  );
}
