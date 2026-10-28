/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

// Preferred Gemma open-weight model as specified in user brief
export const PREFERRED_GEMMA_MODEL = 'gemma-4-26b-a4b-it';

export interface GemmaStatus {
  isKeyConfigured: boolean;
  isGemmaAvailable: boolean;
  currentModel: string;
  availableGemmaModels: string[];
  isOpenWeight: boolean;
  message: string;
  error?: string;
}

// In-memory cache for model discovery to avoid excessive list() calls
let cachedStatus: { data: GemmaStatus; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY secret is not configured in the server environment.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Checks model availability in this account, discovering available Gemma models
 * and strictly enforcing Google's hosted Gemma open-weight models.
 */
export async function getGemmaModelStatus(forceRefresh = false): Promise<GemmaStatus> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      isKeyConfigured: false,
      isGemmaAvailable: false,
      currentModel: PREFERRED_GEMMA_MODEL,
      availableGemmaModels: [],
      isOpenWeight: true,
      message: 'GEMINI_API_KEY is missing. Please configure your API key in Settings > Secrets.',
      error: 'API_KEY_MISSING',
    };
  }

  const now = Date.now();
  if (!forceRefresh && cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return cachedStatus.data;
  }

  try {
    const ai = getAiClient();
    const modelList = await ai.models.list();
    const gemmaModels: string[] = [];

    for await (const m of modelList) {
      if (m.name && m.name.toLowerCase().includes('gemma')) {
        // Strip 'models/' prefix if present for clean UI display and SDK calls
        const cleanName = m.name.replace(/^models\//, '');
        gemmaModels.push(cleanName);
      }
    }

    // Determine current model: prefer gemma-4-26b-a4b-it
    let chosenModel = '';
    if (gemmaModels.includes(PREFERRED_GEMMA_MODEL)) {
      chosenModel = PREFERRED_GEMMA_MODEL;
    } else if (gemmaModels.length > 0) {
      chosenModel = gemmaModels[0];
    }

    const isAvailable = gemmaModels.length > 0;
    const status: GemmaStatus = {
      isKeyConfigured: true,
      isGemmaAvailable: isAvailable,
      currentModel: chosenModel || PREFERRED_GEMMA_MODEL,
      availableGemmaModels: gemmaModels,
      isOpenWeight: true,
      message: isAvailable
        ? `Connected to Google Gemma open-weight model: ${chosenModel}`
        : `No Gemma open-weight models were found in this account's model list.`,
      error: isAvailable ? undefined : 'NO_GEMMA_AVAILABLE',
    };

    cachedStatus = { data: status, timestamp: now };
    return status;
  } catch (err: any) {
    console.error('Failed to query model list:', err?.message || err);
    // Return informative diagnostics without exposing secrets
    return {
      isKeyConfigured: true,
      isGemmaAvailable: false,
      currentModel: PREFERRED_GEMMA_MODEL,
      availableGemmaModels: [],
      isOpenWeight: true,
      message: `Error inspecting available Gemma models: ${err?.message || 'Unknown network error'}.`,
      error: 'MODEL_LIST_FAILED',
    };
  }
}

/**
 * Executes a text generation call specifically targeting a Google Gemma open-weight model.
 * Enforces strictly that closed-weight models are NEVER silently substituted.
 */
export async function generateWithGemma(
  prompt: string,
  requestedModel?: string
): Promise<{ text: string; model: string }> {
  const status = await getGemmaModelStatus();

  if (!status.isKeyConfigured) {
    throw new Error(
      'Server API key not configured. Please add your GEMINI_API_KEY in the Settings > Secrets panel.'
    );
  }

  // Determine target model
  let targetModel = requestedModel || status.currentModel || PREFERRED_GEMMA_MODEL;

  // Enforce Gemma requirement: targetModel must be a Gemma model
  if (!targetModel.toLowerCase().includes('gemma')) {
    throw new Error(
      `Invalid model requested: "${targetModel}". This application strictly requires Google Gemma open-weight models and will not substitute closed-weight models.`
    );
  }

  // Verify availability
  if (!status.isGemmaAvailable) {
    throw new Error(
      `Gemma open-weight models are currently unavailable on this account. Available models did not include a supported Gemma model. Please ensure your API key has access to Gemma open-weight models.`
    );
  }

  // If the requested model is not in the account's available models, check if preferred model exists
  if (
    status.availableGemmaModels.length > 0 &&
    !status.availableGemmaModels.includes(targetModel)
  ) {
    if (status.availableGemmaModels.includes(PREFERRED_GEMMA_MODEL)) {
      targetModel = PREFERRED_GEMMA_MODEL;
    } else {
      targetModel = status.availableGemmaModels[0];
    }
  }

  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
    });

    const responseText = response.text || '';
    if (!responseText.trim()) {
      throw new Error('Gemma model returned an empty response. Please try with shorter notes or rephrase.');
    }

    return {
      text: responseText,
      model: targetModel,
    };
  } catch (err: any) {
    console.error(`Gemma inference error for model ${targetModel}:`, err?.message || err);
    throw new Error(
      `Gemma model error: ${err?.message || 'Failed to generate response. Please check quota or try again.'}`
    );
  }
}

/**
 * Transcribes student spoken notes or recorded lectures using gemini-3.5-transcribe
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string = 'audio/webm'
): Promise<string> {
  const ai = getAiClient();

  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: base64Audio,
      },
    };

    const textPart = {
      text: 'Transcribe this college lecture or study voice note accurately. Fix minor stutters or speech errors, retain technical terms, and format cleanly into readable paragraphs or bullet points suitable for study notes.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, textPart] },
    });

    return response.text?.trim() || 'No transcription could be generated from this audio.';
  } catch (err: any) {
    console.error('Audio transcription error with gemini-3.5-transcribe:', err?.message || err);
    throw new Error(`Transcription failed: ${err?.message || 'Could not process audio.'}`);
  }
}

/**
 * Multi-turn study chat using Gemini models (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-4-argon)
 */
export async function chatWithGemini(
  messages: Array<{ role: string; text: string }>,
  model: string = 'gemini-3.1-flash-lite',
  systemInstruction?: string
): Promise<{ text: string; model: string }> {
  const ai = getAiClient();

  const allowedModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'];
  const targetModel = allowedModels.includes(model) ? model : 'gemini-3.1-flash-lite';

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  const sysInstruction =
    systemInstruction ||
    'You are AI Study Buddy, an encouraging, knowledgeable college academic tutor. Answer student questions thoroughly with clear steps and intuitive analogies.';

  try {
    // Generate response with timeout protection
    const callPromise = ai.models.generateContent({
      model: targetModel,
      contents,
      config: { systemInstruction: sysInstruction },
    });

    // 12s timeout for fallback if a heavy model hangs
    const timeoutPromise = new Promise<{ text: string; model: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Model generation timed out')), 12000)
    );

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;

    return {
      text: response.text?.trim() || 'No response generated.',
      model: targetModel,
    };
  } catch (err: any) {
    console.warn(`Primary chat request with ${targetModel} issue:`, err?.message || err);
    // If not already gemini-3.1-flash-lite, fallback gracefully to gemini-3.1-flash-lite
    if (targetModel !== 'gemini-3.1-flash-lite') {
      try {
        console.log('Falling back to gemini-3.1-flash-lite for faster response...');
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: { systemInstruction: sysInstruction },
        });
        return {
          text: fallbackRes.text?.trim() || 'No response generated.',
          model: 'gemini-3.1-flash-lite (fast fallback)',
        };
      } catch (fbErr: any) {
        throw new Error(`Chat error (${targetModel}): ${fbErr?.message || err?.message}`);
      }
    }
    throw new Error(`Chat error (${targetModel}): ${err?.message || 'Failed to generate response.'}`);
  }
}

/**
 * Video generation from text prompt using gemini-omni-1.1-flash via Interactions API
 */
export async function generateVideoFromText(
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<{ videoBase64: string; mimeType: string }> {
  const ai = getAiClient();

  try {
    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: prompt,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio,
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (!videoPart?.data) {
      throw new Error('Video generation completed but no video data was returned.');
    }

    return {
      videoBase64: videoPart.data,
      mimeType: videoPart.mime_type || 'video/mp4',
    };
  } catch (err: any) {
    console.error('Video generation error (gemini-omni-1.1-flash):', err?.message || err);
    throw new Error(
      `Video generation failed: ${err?.message || 'Requires paid API key or quota available.'}`
    );
  }
}

/**
 * Animate image into video using gemini-omni-1.1-flash via Interactions API
 */
export async function generateVideoFromImage(
  base64Image: string,
  imageMimeType: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<{ videoBase64: string; mimeType: string }> {
  const ai = getAiClient();

  try {
    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: [
          {
            type: 'image',
            mime_type: imageMimeType || 'image/png',
            data: base64Image,
          },
          {
            type: 'text',
            text: prompt || 'Animate this study concept smoothly and clearly.',
          },
        ],
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio,
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (!videoPart?.data) {
      throw new Error('Image-to-video completed but no video payload returned.');
    }

    return {
      videoBase64: videoPart.data,
      mimeType: videoPart.mime_type || 'video/mp4',
    };
  } catch (err: any) {
    console.error('Image-to-video error (gemini-omni-1.1-flash):', err?.message || err);
    throw new Error(
      `Image animation failed: ${err?.message || 'Requires paid API key or quota available.'}`
    );
  }
}
