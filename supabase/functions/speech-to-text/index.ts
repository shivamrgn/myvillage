// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This function handles audio transcription from recorded audio files.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('file');
    const language = formData.get('language') || 'hi';

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Audio file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional: Call OpenAI Whisper API or Google Cloud Speech API
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (OPENAI_API_KEY) {
      const openAiFormData = new FormData();
      openAiFormData.append('file', audioFile);
      openAiFormData.append('model', 'whisper-1');
      openAiFormData.append('language', language.toString().startsWith('hi') ? 'hi' : 'en');

      const sttResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: openAiFormData,
      });

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        throw new Error(`Whisper API error: ${errorText}`);
      }

      const sttData = await sttResponse.json();
      return new Response(
        JSON.stringify({ transcription: sttData.text }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mock fallback if external API key is not configured in secrets
    return new Response(
      JSON.stringify({
        transcription: 'ऑडियो रिकॉर्डिंग सफलतापूर्वक प्राप्त हुई। (Audio received)',
        note: 'Set OPENAI_API_KEY or GOOGLE_SPEECH_KEY in Supabase Edge Function Secrets for cloud AI transcription.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

