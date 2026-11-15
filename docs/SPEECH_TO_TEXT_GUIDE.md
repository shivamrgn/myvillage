# Gram Samadhan — Speech-to-Text (STT) Configuration Guide

This guide details the dual-layer speech recognition architecture for Gram Samadhan:
1. **Live Browser Speech Recognition** (Web Speech API).
2. **Recorded Audio Cloud Transcription** (Provider-independent backend with OpenAI Whisper, Groq Whisper, Google Cloud Speech, or Mock fallback).

---

## 1. Subsystem Architecture

```
                                [ Citizen Grievance Input ]
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
          [ Mode 1: Live Dictation ]                  [ Mode 2: Recorded Voice Note ]
         Browser Web Speech API (Free)                 MediaRecorder API (Opus/AAC)
                      │                                             │
                      ▼                                             ▼
          Chrome / Edge / Android                     Edge Function: /transcribe-audio
       (hi-IN & en-IN Real-Time STT)                                │
                                               ┌────────────────────┼────────────────────┐
                                               ▼                    ▼                    ▼
                                         [ Groq Whisper ]    [ OpenAI Whisper ]   [ Google Cloud ]
                                          Fast & Low-Cost       High Accuracy       Regional STT
                                               │                    │                    │
                                               └────────────────────┴────────────────────┘
                                                                    │
                                                                    ▼
                                                       Transcribed Text returned
                                                        (Citizen review & edit)
```

---

## 2. Mode 1: Live Web Speech API (Client-Side)

### Features:
* **Cost**: $0 (Runs entirely inside the browser).
* **Latency**: Near real-time (< 200 ms).
* **Locales Supported**:
  * Hindi: `hi-IN`
  * English (India): `en-IN`
* **Supported Browsers**: Google Chrome, Microsoft Edge, Android Chrome, Samsung Internet.

### Key Implementation Guidelines:
* **HTTPS Requirement**: The Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`) requires a secure origin (`https://` or `localhost`). It will fail silently or throw errors over insecure `http://`.
* **Microphone Permissions**: Ensure microphone permissions are granted. If blocked, the UI displays guidance explaining how to click the address bar lock icon to grant access.
* **Continuous Dictation**: Gram Samadhan maintains active listening sessions through pauses, capturing interim results and merging them into the final transcript.

---

## 3. Mode 2: Recorded Voice Note & Backend AI Transcription

For citizens using browsers without Web Speech support (e.g. mobile Safari, Firefox) or who prefer recording their full voice message first:

### Audio Capture:
* Uses the HTML5 `MediaRecorder` API.
* Automatically selects optimal container:
  * `audio/webm;codecs=opus` (Chrome, Firefox, Android)
  * `audio/mp4` (Safari, iOS)
* Caps recordings at **5 minutes** (300 seconds) and **25 MB**.
* Allows citizens to pause, resume, replay, delete, or re-record before submitting.

### Configuring Backend STT Providers:

The backend Edge Function `transcribe-audio` supports multiple speech engines configured via Supabase secrets:

#### Option A: Groq Whisper (Recommended for Speed & Cost)
```bash
supabase secrets set \
  STT_PROVIDER="groq" \
  GROQ_API_KEY="gsk_your_groq_api_key_here"
```
* **Engine**: `whisper-large-v3`
* **Average Latency**: ~800 ms.
* **Hindi/English Support**: Excellent.

#### Option B: OpenAI Whisper
```bash
supabase secrets set \
  STT_PROVIDER="openai" \
  OPENAI_API_KEY="sk-proj-your_openai_api_key_here"
```
* **Engine**: `whisper-1`
* **Hindi/English Support**: High quality contextual rural vocabulary.

#### Option C: Google Cloud Speech-to-Text
```bash
supabase secrets set \
  STT_PROVIDER="google" \
  GOOGLE_CLOUD_API_KEY="your_google_cloud_speech_key"
```
* **Engine**: `v1` endpoint with `hi-IN` and `en-IN` models.

#### Option D: Mock Provider (Default for Offline / Zero-Config)
If no API keys are configured, the service defaults to the **Mock Provider**, generating contextual Hindi and English village grievance transcripts for development and demo testing.

---

## 4. Graceful Degradation: Audio-Only Complaint Fallback

If network latency or third-party speech APIs fail:
1. The user is notified gracefully: *"Could not transcribe audio at this time."*
2. A button appears: **"Submit as Voice-Only Complaint"** (`ऑडियो शिकायत दर्ज करें`).
3. The original audio recording is securely saved in private storage, and the complaint is registered so Panchayat staff can listen to the audio note directly in the admin dashboard.

