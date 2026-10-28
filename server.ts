/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  getGemmaModelStatus,
  generateWithGemma,
  transcribeAudio,
  chatWithGemini,
  generateVideoFromText,
  generateVideoFromImage,
} from './src/server/geminiService';
import {
  validateNotes,
  buildExplainPrompt,
  buildSummarizePrompt,
  buildQuizPrompt,
  parseQuizJson,
  LanguageOption,
} from './src/utils/studyLogic';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '15mb' }));

  // API Health and Gemma Model Status Check
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const status = await getGemmaModelStatus(forceRefresh);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({
        isKeyConfigured: !!process.env.GEMINI_API_KEY,
        isGemmaAvailable: false,
        message: err.message || 'Error checking Gemma model status',
        error: 'SERVER_STATUS_ERROR',
      });
    }
  });

  const VALID_LANGUAGES: LanguageOption[] = [
    'simple-english',
    'telugu-english',
    'hindi-english',
    'tamil-english',
    'telugu-script',
    'hindi-script',
    'spanish',
  ];

  const sanitizeLanguage = (raw: any): LanguageOption => {
    return VALID_LANGUAGES.includes(raw) ? raw : 'simple-english';
  };

  // Action 1: Explain Notes
  app.post('/api/study/explain', async (req: Request, res: Response) => {
    try {
      const { notes, language = 'simple-english', model } = req.body;

      const validation = validateNotes(notes);
      if (!validation.isValid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const lang: LanguageOption = sanitizeLanguage(language);

      const prompt = buildExplainPrompt(notes, lang);
      const result = await generateWithGemma(prompt, model);

      res.json({
        success: true,
        explanation: result.text,
        model: result.model,
        language: lang,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Failed to generate explanation. Please try again.',
      });
    }
  });

  // Action 2: Summarize Notes
  app.post('/api/study/summarize', async (req: Request, res: Response) => {
    try {
      const { notes, language = 'simple-english', model } = req.body;

      const validation = validateNotes(notes);
      if (!validation.isValid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const lang: LanguageOption = sanitizeLanguage(language);

      const prompt = buildSummarizePrompt(notes, lang);
      const result = await generateWithGemma(prompt, model);

      res.json({
        success: true,
        summary: result.text,
        model: result.model,
        language: lang,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Failed to generate summary. Please try again.',
      });
    }
  });

  // Action 3: Generate Practice Quiz
  app.post('/api/study/quiz', async (req: Request, res: Response) => {
    try {
      const { notes, language = 'simple-english', model, questionCount = 4 } = req.body;

      const validation = validateNotes(notes);
      if (!validation.isValid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const lang: LanguageOption = sanitizeLanguage(language);

      const count = Math.min(Math.max(Number(questionCount) || 4, 3), 6);
      const prompt = buildQuizPrompt(notes, lang, count);
      const result = await generateWithGemma(prompt, model);

      try {
        const questions = parseQuizJson(result.text);
        res.json({
          success: true,
          quiz: questions,
          model: result.model,
          language: lang,
        });
      } catch (parseError: any) {
        console.error('Quiz JSON parse error. Raw model output was:\n', result.text);
        res.status(502).json({
          error:
            'Gemma model generated a quiz response that could not be parsed into structured format. Please try generating again.',
          rawText: result.text,
        });
      }
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Failed to generate practice quiz. Please try again.',
      });
    }
  });

  // Feature: Audio Transcription using gemini-3.5-transcribe
  app.post('/api/transcribe', async (req: Request, res: Response) => {
    try {
      const { audio, mimeType = 'audio/webm' } = req.body;
      if (!audio) {
        res.status(400).json({ error: 'No audio data received for transcription.' });
        return;
      }

      const transcription = await transcribeAudio(audio, mimeType);
      res.json({
        success: true,
        transcription,
        model: 'gemini-3.5-transcribe',
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Audio transcription failed.',
      });
    }
  });

  // Feature: Multi-turn Chatbot with Gemini
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages, model = 'gemini-3.1-flash-lite', systemInstruction } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const result = await chatWithGemini(messages, model, systemInstruction);
      res.json({
        success: true,
        text: result.text,
        model: result.model,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Chat generation failed.',
      });
    }
  });

  // Feature: Text to Video using gemini-omni-1.1-flash (Interactions API)
  app.post('/api/video/generate', async (req: Request, res: Response) => {
    try {
      const { prompt, aspectRatio = '16:9' } = req.body;
      if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: 'Prompt is required for video generation.' });
        return;
      }

      const ratio = aspectRatio === '9:16' ? '9:16' : '16:9';
      const result = await generateVideoFromText(prompt, ratio);
      res.json({
        success: true,
        videoBase64: result.videoBase64,
        mimeType: result.mimeType,
        model: 'gemini-omni-1.1-flash',
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Video generation failed.',
      });
    }
  });

  // Feature: Image to Video using gemini-omni-1.1-flash (Interactions API)
  app.post('/api/video/animate', async (req: Request, res: Response) => {
    try {
      const { imageBase64, imageMimeType = 'image/png', prompt, aspectRatio = '16:9' } = req.body;
      if (!imageBase64) {
        res.status(400).json({ error: 'Image data is required to animate.' });
        return;
      }

      const ratio = aspectRatio === '9:16' ? '9:16' : '16:9';
      const result = await generateVideoFromImage(imageBase64, imageMimeType, prompt, ratio);
      res.json({
        success: true,
        videoBase64: result.videoBase64,
        mimeType: result.mimeType,
        model: 'gemini-omni-1.1-flash',
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Image animation failed.',
      });
    }
  });

  // Setup WebSocket Server for Live API voice conversations (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('Client connected to /live WebSocket');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        clientWs.send(JSON.stringify({ error: 'Server GEMINI_API_KEY is not configured.' }));
        clientWs.close();
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'You are AI Study Buddy, an interactive voice tutor for college students. Speak naturally, warmly, and concisely. Keep answers focused and engaging for college exam learning.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });

      clientWs.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (err) {
          console.error('Error forwarding live audio chunk:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch (e) {}
      });
    } catch (err: any) {
      console.error('Live API connection error:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: err.message || 'Live session failed to connect.' }));
        clientWs.close();
      }
    }
  });

  // Setup frontend serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Study Buddy server running on http://0.0.0.0:${PORT} (${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
