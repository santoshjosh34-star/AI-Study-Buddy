/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, Volume2, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

interface ChatTurn {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
}

export const LiveVoiceTutor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to connect with your Live Voice Tutor');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('General College Prep');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Topics for quick selection
  const TOPICS = [
    'General College Prep',
    'Data Structures & Algorithms',
    'Calculus & Linear Algebra',
    'Organic Chemistry & Biology',
    'Operating Systems & Networking',
  ];

  // Initialize and connect to Live WebSocket
  const startVoiceSession = async () => {
    try {
      setStatusMessage('Requesting microphone permissions...');

      // 1. Microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup AudioContext for input processing
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      // Output playback context (Gemini Live outputs 24kHz PCM)
      const PlaybackCtx = window.AudioContext || (window as any).webkitAudioContext;
      const playbackCtx = new PlaybackCtx({ sampleRate: 24000 });
      playbackContextRef.current = playbackCtx;
      nextPlayTimeRef.current = playbackCtx.currentTime;

      // Analyser for visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // ScriptProcessor for 16-bit PCM streaming (buffer size 2048)
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      // 3. Connect to WebSocket `/live`
      setStatusMessage('Connecting to Gemini 3.8 Live API...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusMessage('Connected! Speak freely with your AI Voice Tutor.');
        setTurns((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'tutor',
            text: `Hello! I'm your Live Study Tutor. We are exploring ${selectedTopic}. Ask me anything or explain what you are studying!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'error') {
            setStatusMessage(`Notice: ${msg.error}`);
            return;
          }

          if (msg.type === 'status') {
            setStatusMessage(msg.message);
            return;
          }

          // Handle incoming audio PCM from Gemini Live
          if (msg.audio) {
            setIsAiSpeaking(true);
            playPcmChunk(msg.audio);
          }

          // Handle text transcript from Gemini Live
          if (msg.text) {
            setTurns((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'tutor') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + ' ' + msg.text },
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: String(Date.now()),
                    sender: 'tutor',
                    text: msg.text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ];
              }
            });
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      ws.onclose = () => {
        endVoiceSession();
        setStatusMessage('Voice session closed.');
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setStatusMessage('Connection failed. Make sure your GEMINI_API_KEY is configured.');
      };

      // Process and send audio data chunks to WebSocket
      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN || isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32Array (-1.0 to 1.0) to 16-bit PCM little-endian
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const binary = String.fromCharCode(...new Uint8Array(pcm16.buffer));
        const base64Audio = btoa(binary);

        ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Audio,
                },
              ],
            },
          })
        );
      };

      analyser.connect(processor);
      processor.connect(audioCtx.destination);

      // Start level meter loop
      startVisualizer();
    } catch (err: any) {
      console.error('Failed to start voice session:', err);
      setStatusMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access.'
          : `Failed to initialize audio: ${err.message}`
      );
      endVoiceSession();
    }
  };

  // Playback raw 24kHz PCM chunks with gapless scheduling
  const playPcmChunk = (base64Audio: string) => {
    try {
      const pCtx = playbackContextRef.current;
      if (!pCtx) return;
      if (pCtx.state === 'suspended') {
        pCtx.resume();
      }

      const binaryStr = atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = pCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = pCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(pCtx.destination);

      const startTime = Math.max(pCtx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      source.onended = () => {
        if (pCtx.currentTime >= nextPlayTimeRef.current - 0.05) {
          setIsAiSpeaking(false);
        }
      };
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  const startVisualizer = () => {
    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 32);
    const update = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(avg);
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  const endVoiceSession = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsAiSpeaking(false);
    setAudioLevel(0);
    setStatusMessage('Voice session ended.');
  };

  useEffect(() => {
    return () => {
      endVoiceSession();
    };
  }, []);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white">Live Voice Study Tutor</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
              gemini-3.8-live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time, ultra-low latency voice dialogue powered by the Gemini Live bidirectional API.
          </p>
        </div>

        {/* Topic Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400 whitespace-nowrap">Focus:</label>
          <select
            value={selectedTopic}
            disabled={isConnected}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Voice Orb & Visualizer Stage */}
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 relative overflow-hidden">
        {/* Ambient pulse */}
        <div
          className={`absolute w-72 h-72 rounded-full transition-all duration-300 blur-3xl pointer-events-none ${
            isAiSpeaking
              ? 'bg-indigo-500/25 scale-125'
              : isConnected
              ? 'bg-sky-500/20 scale-100'
              : 'bg-slate-700/10 scale-75'
          }`}
        />

        {/* Central Voice Spherical Avatar */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 border shadow-2xl ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-indigo-400/80 shadow-indigo-500/40 animate-pulse'
                : isConnected
                ? 'bg-gradient-to-tr from-sky-500 to-emerald-500 border-sky-400/80 shadow-sky-500/40'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isAiSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : isConnected ? (
              <Mic className="w-12 h-12 text-white" />
            ) : (
              <MicOff className="w-10 h-10 text-slate-500" />
            )}
          </div>

          {/* Real-time sound wave bars */}
          <div className="flex items-center gap-1.5 h-8 mt-5">
            {[...Array(14)].map((_, i) => {
              const active = isConnected;
              const barHeight = active
                ? Math.min(32, Math.max(4, (audioLevel / 255) * 36 * (Math.sin(i * 0.6) + 1.2)))
                : 4;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isAiSpeaking
                      ? 'bg-indigo-400'
                      : isConnected
                      ? 'bg-sky-400'
                      : 'bg-slate-700'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>

          <p className="text-xs font-medium text-slate-300 mt-3 flex items-center gap-1.5">
            {isAiSpeaking ? (
              <span className="text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Tutor is speaking...
              </span>
            ) : isConnected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Listening to your microphone
              </span>
            ) : (
              <span className="text-slate-400">Microphone standby</span>
            )}
          </p>

          <p className="text-[11px] text-slate-500 mt-1 max-w-sm text-center">
            {statusMessage}
          </p>
        </div>

        {/* Action Call Buttons */}
        <div className="flex items-center gap-3 mt-6 z-10">
          {!isConnected ? (
            <button
              onClick={startVoiceSession}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
            >
              <PhoneCall className="w-4 h-4" /> Start Voice Session
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-xl border transition ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={endVoiceSession}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/25 transition transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
              >
                <PhoneOff className="w-4 h-4" /> End Call
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Session Conversation Log
          </span>
          {turns.length > 0 && (
            <button
              onClick={() => setTurns([])}
              className="text-slate-500 hover:text-slate-300 transition text-[11px]"
            >
              Clear Log
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2.5 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs">
          {turns.length === 0 ? (
            <p className="text-slate-500 text-center py-4 italic">
              Spoken conversation turns and feedback will appear here in real-time.
            </p>
          ) : (
            turns.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl border ${
                  t.sender === 'user'
                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-100 ml-6'
                    : 'bg-slate-800/90 border-slate-700 text-slate-200 mr-6'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {t.sender === 'user' ? 'You (Audio)' : 'Gemini Voice Tutor'}
                  </span>
                  <span>{t.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{t.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
