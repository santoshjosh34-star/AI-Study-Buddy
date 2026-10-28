/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Play, Check, Copy, ArrowRight, FileText, Loader2, RefreshCw } from 'lucide-react';

interface LectureTranscriberProps {
  onInsertIntoNotes: (text: string) => void;
}

export const LectureTranscriber: React.FC<LectureTranscriberProps> = ({ onInsertIntoNotes }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setRecordingSeconds(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        setAudioBlob(finalBlob);
        setAudioUrl(URL.createObjectURL(finalBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(500); // 500ms slices
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access.'
          : `Failed to access microphone: ${err.message}`
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Audio file size exceeds the 15MB limit. Please upload a shorter lecture clip.');
      return;
    }

    setError(null);
    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  };

  const processTranscription = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    setError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          // Strip data:audio/xyz;base64,
          const base64Data = res.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);

      const base64Audio = await base64Promise;
      const mimeType = audioBlob.type || 'audio/webm';

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, mimeType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Audio transcription failed');
      }

      setTranscription(data.transcription);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio. Verify GEMINI_API_KEY.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white">Lecture Audio Transcriber</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              gemini-3.5-transcribe
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Record class lectures or upload professor voice recordings to generate structured notes with high accuracy.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-center gap-2.5">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Recording & Upload Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Record Card */}
        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Live Microphone Capture
          </span>

          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-400 animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}
          >
            <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
          </div>

          <div className="font-mono text-2xl font-bold text-white">
            {formatTime(recordingSeconds)}
          </div>

          {!isRecording ? (
            <button
              onClick={startRecording}
              className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Mic className="w-3.5 h-3.5" /> Start Lecture Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop & Review Recording
            </button>
          )}
        </div>

        {/* Upload Audio File Card */}
        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Upload Existing Audio File
          </span>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-slate-700 hover:border-emerald-400/60 rounded-xl flex flex-col items-center justify-center cursor-pointer p-4 transition bg-slate-900/40 hover:bg-slate-900/80"
          >
            <Upload className="w-6 h-6 text-emerald-400 mb-2" />
            <p className="text-xs font-medium text-slate-200">
              Click to select audio file
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              MP3, WAV, M4A, WEBM, OGG (Max 15MB)
            </p>
          </div>

          {audioBlob && (
            <div className="w-full flex items-center justify-between text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="truncate max-w-[200px]">
                {(audioBlob as any).name || 'Microphone recording'}
              </span>
              <span className="text-[11px] text-slate-400">
                {(audioBlob.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Audio Playback & Transcribe CTA */}
      {audioUrl && (
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <audio controls src={audioUrl} className="w-full sm:w-80 h-10 rounded" />

          <button
            onClick={processTranscription}
            disabled={isTranscribing}
            className="w-full sm:w-auto py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Transcribing with Gemini 3.5...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" /> Transcribe to Notes
              </>
            )}
          </button>
        </div>
      )}

      {/* Result Section */}
      {transcription && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Lecture Transcript Ready
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>

              <button
                onClick={() => onInsertIntoNotes(transcription)}
                className="px-3.5 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-semibold text-white rounded-lg shadow transition flex items-center gap-1.5"
              >
                Insert into Study Notes <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap font-sans">
            {transcription}
          </div>
        </div>
      )}
    </div>
  );
};
