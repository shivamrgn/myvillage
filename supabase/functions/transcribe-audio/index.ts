// supabase/functions/transcribe-audio/index.ts
// Provider-independent Audio Transcription Edge Function for Gram Samadhan.
// Supports Mock, OpenAI Whisper, Groq Whisper, and Google Cloud Speech-to-Text.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

// Standard CORS headers for client interaction
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Maximum allowed audio size (25 MB)
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/aac',
];

interface TranscriptionResult {
  text: string;
  language: string;
  provider: string;
  duration?: number;
  confidence?: number;
  note?: string;
}

interface TranscriptionProvider {
  name: string;
  transcribe(audioFile: File, language: string): Promise<TranscriptionResult>;
}

/**
 * 1. Mock Provider
 * Used for development, testing, and offline / zero-credential deployments.
 * Returns contextual village grievance transcripts in Hindi or English.
 */
class MockProvider implements TranscriptionProvider {
  name = 'mock';

  async transcribe(_audioFile: File, language: string): Promise<TranscriptionResult> {
    // Simulate realistic STT processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const isHindi = language.toLowerCase().startsWith('hi');

    const sampleHindiTranscripts = [
      'हमारे गांव के वार्ड नंबर 4 में प्राथमिक विद्यालय के पास लगा सरकारी हैंडपंप पिछले 10 दिनों से खराब पड़ा है। पीने के पानी की भारी समस्या हो रही है। कृपया इसे जल्द ठीक कराएं।',
      'गांव की मुख्य सड़क पर बारिश के पानी का भराव हो गया है और नाली टूटी हुई है। आने-जाने में ग्रामीणों को भारी परेशानी हो रही है। कृपया सफाई और मरम्मत करवाएं।',
      'हमारे मोहल्ले में रात के समय स्ट्रीट लाइट पिछले एक हफ्ते से बंद है। अंधेरे के कारण महिलाओं और बच्चों को डर लगता है। कृपया नई लाइट लगवाने की कृपा करें।',
    ];

    const sampleEnglishTranscripts = [
      'The public handpump near the primary school in Ward 4 has been broken for 10 days, causing a severe drinking water shortage. Please inspect and repair it urgently.',
      'Waterlogging on the main village road due to a damaged drainage line is obstructing pedestrian movement. Please arrange for cleaning and repair.',
      'The street light in our ward has not been functioning for the past week, creating darkness and safety issues at night. Kindly replace the bulb.',
    ];

    const list = isHindi ? sampleHindiTranscripts : sampleEnglishTranscripts;
    const selectedText = list[Math.floor(Math.random() * list.length)];

    return {
      text: selectedText,
      language: isHindi ? 'hi-IN' : 'en-IN',
      provider: 'mock',
      confidence: 0.96,
      note: 'Processed via Gram Samadhan Mock Provider. Configure OPENAI_API_KEY, GROQ_API_KEY, or GOOGLE_CLOUD_API_KEY in Edge Function secrets for cloud AI transcription.',
    };
  }
}

/**
 * 2. OpenAI Whisper Provider
 * Calls official OpenAI Whisper-1 endpoint.
 */
class OpenAIWhisperProvider implements TranscriptionProvider {
  name = 'openai-whisper';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioFile: File, language: string): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', language.toLowerCase().startsWith('hi') ? 'hi' : 'en');
    formData.append(
      'prompt',
      'Gram Panchayat rural complaint, village grievance reporting in Hindi and Indian English regarding handpump, roads, sanitation, electricity, water.'
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Whisper error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const transcribedText = (data.text || '').trim();

      if (!transcribedText) {
        throw new Error('Empty transcription returned by OpenAI Whisper.');
      }

      return {
        text: transcribedText,
        language,
        provider: 'openai-whisper',
        confidence: 0.98,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('OpenAI Whisper request timed out after 45 seconds.');
      }
      throw err;
    }
  }
}

/**
 * 3. Groq Whisper Provider
 * Ultra-fast Whisper large-v3 inference endpoint.
 */
class GroqWhisperProvider implements TranscriptionProvider {
  name = 'groq-whisper';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioFile: File, language: string): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', language.toLowerCase().startsWith('hi') ? 'hi' : 'en');
    formData.append('temperature', '0.0');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq Whisper error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const transcribedText = (data.text || '').trim();

      if (!transcribedText) {
        throw new Error('Empty transcription returned by Groq Whisper.');
      }

      return {
        text: transcribedText,
        language,
        provider: 'groq-whisper',
        confidence: 0.99,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Groq Whisper request timed out after 30 seconds.');
      }
      throw err;
    }
  }
}

/**
 * 4. Google Cloud Speech-to-Text Provider
 * Calls Google Cloud Speech v1 REST API.
 */
class GoogleCloudSpeechProvider implements TranscriptionProvider {
  name = 'google-cloud-speech';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioFile: File, language: string): Promise<TranscriptionResult> {
    const arrayBuffer = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    const langCode = language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';

    const payload = {
      config: {
        encoding: audioFile.type.includes('wav') ? 'LINEAR16' : 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: langCode,
        alternativeLanguageCodes: ['hi-IN', 'en-IN'],
        enableAutomaticPunctuation: true,
        model: 'default',
      },
      audio: {
        content: base64Audio,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google Cloud Speech error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const results = data.results || [];
      const text = results
        .map((r: any) => r.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();

      if (!text) {
        throw new Error('Empty transcription returned by Google Cloud Speech.');
      }

      return {
        text,
        language: langCode,
        provider: 'google-cloud-speech',
        confidence: results[0]?.alternatives?.[0]?.confidence || 0.95,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Google Cloud Speech request timed out.');
      }
      throw err;
    }
  }
}

/**
 * Provider Factory: Selects provider based on configured secrets
 */
function resolveProvider(): TranscriptionProvider {
  const configuredProvider = Deno.env.get('STT_PROVIDER')?.toLowerCase();

  const groqKey = Deno.env.get('GROQ_API_KEY');
  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  const googleKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');

  if (configuredProvider === 'groq' && groqKey) {
    return new GroqWhisperProvider(groqKey);
  }
  if (configuredProvider === 'openai' && openAiKey) {
    return new OpenAIWhisperProvider(openAiKey);
  }
  if (configuredProvider === 'google' && googleKey) {
    return new GoogleCloudSpeechProvider(googleKey);
  }

  // Automatic discovery if STT_PROVIDER is not explicitly specified
  if (groqKey) return new GroqWhisperProvider(groqKey);
  if (openAiKey) return new OpenAIWhisperProvider(openAiKey);
  if (googleKey) return new GoogleCloudSpeechProvider(googleKey);

  // Default to development mock provider
  return new MockProvider();
}

/**
 * Main HTTP Server Entrypoint
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({
          error: 'Content-Type must be multipart/form-data with file and language fields.',
          code: 'ERR_INVALID_CONTENT_TYPE',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || 'hi-IN';
    const trackingCode = (formData.get('trackingCode') as string) || '';

    // 1. Validation: File existence
    if (!audioFile) {
      return new Response(
        JSON.stringify({
          error: 'Audio file is required in formData under the "file" key.',
          code: 'ERR_EMPTY_RECORDING',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validation: File size
    if (audioFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (audioFile.size / (1024 * 1024)).toFixed(1);
      return new Response(
        JSON.stringify({
          error: `Audio file is too large (${sizeMb} MB). Maximum allowed size is 25 MB.`,
          code: 'ERR_FILE_TOO_LARGE',
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (audioFile.size === 0) {
      return new Response(
        JSON.stringify({
          error: 'Uploaded audio file is empty (0 bytes).',
          code: 'ERR_EMPTY_RECORDING',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validation: MIME type
    const mimeType = audioFile.type || 'audio/webm';
    const isAllowedMime = ALLOWED_MIME_TYPES.some((type) => mimeType.toLowerCase().startsWith(type));
    if (!isAllowedMime && !mimeType.startsWith('audio/')) {
      return new Response(
        JSON.stringify({
          error: `Unsupported audio MIME type "${mimeType}". Allowed: WebM, OGG, MP4, WAV.`,
          code: 'ERR_UNSUPPORTED_FORMAT',
        }),
        { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Optional Storage Upload to Supabase Storage 'audio-recordings'
    let storedAudioUrl: string | null = null;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        const ext = audioFile.name.split('.').pop() || 'webm';
        const storagePath = `recordings/${new Date().getFullYear()}/${Date.now()}_${trackingCode || 'anon'}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-recordings')
          .upload(storagePath, audioFile, {
            contentType: mimeType,
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('audio-recordings')
            .getPublicUrl(uploadData.path);
          storedAudioUrl = publicUrlData?.publicUrl || null;
        }
      } catch (storageErr) {
        console.warn('[transcribe-audio] Supabase Storage upload skipped/failed:', storageErr);
      }
    }

    // 5. Select Provider and Execute Speech-to-Text
    const provider = resolveProvider();
    const result = await provider.transcribe(audioFile, language);

    return new Response(
      JSON.stringify({
        success: true,
        text: result.text,
        language: result.language,
        provider: result.provider,
        confidence: result.confidence,
        audioUrl: storedAudioUrl,
        note: result.note,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[transcribe-audio] Internal error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Speech-to-text processing failed.',
        code: err.message?.includes('timed out') ? 'ERR_TIMEOUT' : 'ERR_TRANSCRIPTION_FAILED',
        canSubmitAudioOnly: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

