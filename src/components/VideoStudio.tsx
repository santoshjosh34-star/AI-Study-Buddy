/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Video, Film, Sparkles, Image as ImageIcon, Play, Upload, AlertCircle, Info, Download, Loader2 } from 'lucide-react';

export const VideoStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const SAMPLE_VIDEO_PROMPTS = [
    '3D animation of DNA double helix unwinding and replicating with nucleotide labels',
    'Physic simulation: Projectile motion trajectory with velocity vector arrows at 45 degrees',
    'Algorithm visualization: Visual representation of Binary Search splitting a sorted array',
    'Geology animation: Plate tectonics collision creating an oceanic trench and volcano',
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image exceeds the 8MB limit. Please upload a smaller image.');
      return;
    }

    setErrorMessage(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateTextToVideo = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setVideoResult(null);

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Video generation failed.');
      }

      if (data.videoBase64) {
        setVideoResult(`data:${data.mimeType || 'video/mp4'};base64,${data.videoBase64}`);
      } else {
        throw new Error('Video generation completed but no video data was returned.');
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      setErrorMessage(
        err.message?.includes('billed') || err.message?.includes('403') || err.message?.includes('paid')
          ? 'gemini-omni-1.1-flash requires a Google Cloud project with billing enabled. Free-tier keys cannot invoke Omni video generation. To enable, configure a paid key in AI Studio Secrets.'
          : err.message || 'Video generation failed. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImageToVideo = async () => {
    if (!imagePreview || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setVideoResult(null);

    try {
      // Extract base64 without prefix
      const base64Data = imagePreview.split(',')[1];
      const mimeType = imageFile?.type || 'image/png';

      const res = await fetch('/api/video/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          imageMimeType: mimeType,
          prompt: prompt.trim() || 'Smooth camera orbit bringing diagram to life',
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Image animation failed.');
      }

      if (data.videoBase64) {
        setVideoResult(`data:${data.mimeType || 'video/mp4'};base64,${data.videoBase64}`);
      } else {
        throw new Error('Animation completed but no video data was returned.');
      }
    } catch (err: any) {
      console.error('Image animation error:', err);
      setErrorMessage(
        err.message?.includes('billed') || err.message?.includes('403') || err.message?.includes('paid')
          ? 'gemini-omni-1.1-flash requires a Google Cloud project with billing enabled. Free-tier keys cannot invoke Omni video generation. To enable, configure a paid key in AI Studio Secrets.'
          : err.message || 'Image animation failed. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white">AI Concept Video Studio</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              gemini-omni-1.1-flash
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transform study prompts or diagram sketches into high-fidelity animated video demonstrations.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              setActiveTab('text-to-video');
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'text-to-video'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Text to Video
          </button>
          <button
            onClick={() => {
              setActiveTab('image-to-video');
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'image-to-video'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Animate Image
          </button>
        </div>
      </div>

      {/* Info notice about Omni Paid Tier model */}
      <div className="p-3.5 bg-slate-950/60 border border-purple-900/40 rounded-xl text-xs text-purple-200/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-purple-200">
            Omni Video Generation Requirements
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            <code>gemini-omni-1.1-flash</code> is Google’s multimodal video generation model via the Interactions API. It requires a Google Cloud billing account attached to your API key. Free-tier users can run audio transcription, live voice, and notes analysis without restrictions!
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-rose-100">Video Generation Notice:</span>
            <p className="text-rose-200/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="space-y-4">
          {activeTab === 'image-to-video' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Upload Diagram or Notes Image to Animate
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-44 border-2 border-dashed border-slate-700 hover:border-purple-400/60 rounded-xl flex flex-col items-center justify-center cursor-pointer p-4 transition bg-slate-950/40 hover:bg-slate-950/80 relative overflow-hidden"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Diagram to animate"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-purple-400 mb-2" />
                    <p className="text-xs font-medium text-slate-200">
                      Click to choose diagram / notes screenshot
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WEBP (Max 8MB)</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {activeTab === 'text-to-video' ? 'Concept Prompt' : 'Animation Motion Prompt (Optional)'}
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'text-to-video'
                  ? 'Describe the scientific phenomenon, flowchart, or concept to render as video...'
                  : 'E.g., Animate the flow of electrons along this circuit diagram...'
              }
              className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Aspect Ratio Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-medium text-slate-400">Aspect Ratio:</span>
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  aspectRatio === '16:9'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                16:9 (Landscape)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  aspectRatio === '9:16'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                9:16 (Portrait)
              </button>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={activeTab === 'text-to-video' ? handleGenerateTextToVideo : handleGenerateImageToVideo}
            disabled={
              isGenerating ||
              (activeTab === 'text-to-video' && !prompt.trim()) ||
              (activeTab === 'image-to-video' && !imagePreview)
            }
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Concept Video (Omni Flash)...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> {activeTab === 'text-to-video' ? 'Render Video Concept' : 'Animate Diagram into Video'}
              </>
            )}
          </button>

          {/* Suggested Prompts */}
          {activeTab === 'text-to-video' && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Sample Study Prompts
              </span>
              <div className="space-y-1">
                {SAMPLE_VIDEO_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sp)}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition truncate block"
                  >
                    💡 {sp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Video Preview Canvas */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden min-h-[300px]">
          {videoResult ? (
            <div className="w-full flex flex-col items-center space-y-4">
              <video
                src={videoResult}
                controls
                autoPlay
                loop
                className={`max-h-[320px] rounded-xl shadow-2xl border border-slate-700 ${
                  aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
                }`}
              />
              <a
                href={videoResult}
                download={`study-concept-${Date.now()}.mp4`}
                className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" /> Download Video
              </a>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center animate-pulse">
                <Film className="w-8 h-8 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-white">Synthesizing Educational Video...</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Gemini Omni Flash is composing frames and animations. This may take a minute.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-slate-500">
              <Film className="w-12 h-12 text-slate-700" />
              <p className="text-xs font-medium text-slate-400">Video Preview Stage</p>
              <p className="text-[11px] max-w-xs text-slate-500">
                Generated study animations will play here once rendered by the model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
