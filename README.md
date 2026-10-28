# AI Study Buddy 🎓 (College Edition)

**AI Study Buddy** is a comprehensive, responsive full-stack web application designed for college students to master complex academic topics, break down lecture notes, generate revision summaries, practice interactive quizzes, converse with real-time AI tutors, transcribe lecture recordings, render concept videos, and recharge with a 60 FPS campus arcade runner.

Powered by Google's hosted **Gemma 4 open-weight model** (`gemma-4-26b-a4b-it`) and modern Google GenAI models (`gemini-3.1-flash-lite`, `gemini-3.8-live`, `gemini-3.5-transcribe`, `gemini-omni-1.1-flash`) via the official `@google/genai` TypeScript SDK.

---

## 🌟 The 6 Integrated Study Suites

### 1. 📝 Study Workspace (Google Gemma 4 Open-Weight)
- **Open-Weight Integrity**: Uses Google's hosted `gemma-4-26b-a4b-it` (or `gemma-4-31b-it`). Zero closed-weight substitution.
- **7 Multilingual & Bilingual Languages**:
  1. *Simple English*: Plain, accessible English with simplified jargon and analogies.
  2. *Telugu-English (Tenglish in Latin letters)*: Conversational Telugu in English script (e.g., *"Ee concept exam ki chala important..."*).
  3. *Hindi-English (Hinglish in Latin letters)*: Conversational Hindi in English script (e.g., *"Yeh concept exam ke liye bohot zaroori hai..."*).
  4. *Tamil-English (Tanglish in Latin letters)*: Conversational Tamil in English script (e.g., *"Indha concept exam point of view la romba mukkiyam..."*).
  5. *Telugu Script (తెలుగు లిపి)*: Native Telugu typography with core technical terms preserved.
  6. *Hindi Script (हिंदी देवनागरी)*: Native Hindi Devanagari typography with technical formulas.
  7. *Simple Spanish (Español)*: Clear academic Spanish for international learners.
- **Three Actions**:
  - 📖 **Explain Notes**: In-depth conceptual breakdown with 4 structured sections (Core Concept, Step-by-Step, College Analogy, Exam Hall Takeaways).
  - ⚡ **Summarize Notes**: High-retention revision summary with Executive TL;DR, high-yield bullet points, and 5-minute revision checklist.
  - 🎯 **Generate Practice Quiz**: Multiple-choice questions (MCQs) with instant answer checking, pedagogical explanations, and score tracking with letter grades.
- **Tools**: Text-to-Speech audio reading, 1-click clipboard copy, and `.txt` file export.

### 2. 💬 AI Study Chat (Multi-Turn Conversational Tutor)
- **Models**: `gemini-3.1-flash-lite` (fast, instant answers), `gemini-3.8-flash` (balanced), and `gemini-4-argon` (complex reasoning).
- **3 Dynamic Personas**:
  - 🎓 **Prof. Bennett**: Socratic academic mentor using first principles and analogies.
  - 🤝 **Alex**: Senior study partner with practical mnemonics and exam shortcuts.
  - ⏱️ **Coach Maya**: Exam drill master challenging you with timed practice and trap warnings.
- **Features**: Quick starter chips, chat history memory, and markdown rendering.

### 3. 🎙️ Live Voice Tutor (Real-Time Bidirectional Speech)
- Powered by `gemini-3.8-live` using the official `@google/genai` Live API over low-latency WebSockets (`/live`).
- **Audio Pipeline**:
  - Live microphone input captured, downsampled, and streamed as 16-bit PCM at 16,000 Hz.
  - Model voice responses received as 24,000 Hz PCM chunks and scheduled gaplessly via Web Audio API.
- **Visualizer**: Real-time pulsing audio visualizer bars, speaker indicators, and live transcript logs.

### 4. 🎤 Lecture Audio Transcriber
- Powered by `gemini-3.5-transcribe`.
- Record professor lectures directly in browser or upload `.mp3`, `.wav`, `.m4a`, `.webm`, or `.ogg` files (up to 15MB).
- Cleans up speech disfluencies, preserves technical terms, and formats into structured notes.
- **1-Click "Insert into Study Notes"**: Automatically copies transcription directly into the Gemma Study Workspace for instant explanations or quiz generation.

### 5. 🎬 AI Concept Video Studio
- Powered by `gemini-omni-1.1-flash` via the Interactions API.
- **Modes**:
  - *Text to Video*: Generate animated concept demonstrations from natural language descriptions.
  - *Animate Diagram*: Upload whiteboard diagrams or textbook charts to render motion animations.
- **Aspect Ratios**: 16:9 Landscape (Desktop/Presentations) and 9:16 Portrait (Mobile/Stories).
- **Billing Notice**: Transparent informational banner detailing paid-tier requirements for Omni video generation.

### 6. 🎮 Campus Arcade: Brain Dash (60 FPS Exam Sprint)
- High-performance study runner built with HTML5 Canvas and procedural Web Audio synthesizer (zero external sound assets).
- **Gameplay**:
  - Low-occlusion HUD (<15% screen space) displaying Score, Streak, and Coffee Stamina.
  - Jump over finals-week distractions: Doomscrolling feeds, snooze naps, and code bugs.
  - Collect Knowledge Orbs (A+, Coffee, Algorithms, Books).
  - Every 500 points, answer an instant **Study Checkpoint Question** for a 2X GPA Boost and stamina refill!
  - Controls: Spacebar / Arrow Up / W / Tap on Mobile to jump; P to pause; M to mute.

---

## 🔒 Server-Side Security & Secret Protection

- All AI requests and API keys are managed exclusively on the server side (`server.ts` & `src/server/geminiService.ts`).
- `GEMINI_API_KEY` is loaded securely via server environment variables.
- **Never** exposed to the browser, JavaScript bundles, HTML DOM, or telemetry.

---

## 🛠️ Project Structure

```text
├── .env.example              # Placeholder environment variables (no secrets)
├── .gitignore                # Git ignore rules (node_modules, .env, .playwright-cli)
├── index.html                # App entry HTML with synced title and OpenGraph metadata
├── metadata.json             # AI Studio applet metadata & major capabilities
├── package.json              # Full-stack dependencies (React 19, Express, @google/genai, ws)
├── server.ts                 # Full-stack Express server + WebSocket /live + API routes
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler configuration
└── src/
    ├── main.tsx              # React client entry point
    ├── App.tsx               # Main layout & 6-suite navigation tab switcher
    ├── index.css             # Tailwind CSS & animations
    ├── components/
    │   ├── Header.tsx        # Top navigation & Gemma model status badge
    │   ├── ModelBanner.tsx   # Model diagnostics, API key alert & model selector
    │   ├── LanguageSelector.tsx # 7-language selector with samples & badges
    │   ├── NotesInput.tsx    # Textarea, quick college demo topics & action buttons
    │   ├── LoadingState.tsx  # Animated study progress indicators & quotes
    │   ├── ExplanationCard.tsx # Structured explanation, TTS audio, copy & download
    │   ├── SummaryCard.tsx   # Revision summary, checklist & export
    │   ├── QuizCard.tsx      # Interactive MCQ quiz with immediate feedback & grades
    │   ├── GemmaModal.tsx    # Open-weight architecture details and licensing dialog
    │   ├── Footer.tsx        # Footer with security badge and credits
    │   ├── CampusArcadeGame.tsx # 60fps Canvas runner with Web Audio synth & checkpoints
    │   ├── LiveVoiceTutor.tsx # Gemini 3.8 Live WebSocket real-time voice interaction
    │   ├── LectureTranscriber.tsx # Mic recording & upload with Gemini 3.5 Transcribe
    │   ├── StudyChatbot.tsx  # Multi-turn Gemini chatbot with 3 tutor personas
    │   └── VideoStudio.tsx   # Text-to-Video & Image animation with Omni Flash
    ├── server/
    │   └── geminiService.ts  # Server-side GenAI SDK integration & Gemma availability
    └── utils/
        ├── studyLogic.ts     # Pure validation, prompt builders, quiz parser & scoring
        └── studyLogic.test.ts # Fast-feedback unit tests via node:test and tsx
```

---

## ⚙️ How to Configure the API Secret in AI Studio

1. Open the AI Studio project workspace.
2. In the right-hand panel, select **Settings** (or the **Secrets** icon).
3. Under **Environment Secrets**, click **Add Secret**.
4. Enter `GEMINI_API_KEY` as the Secret Name.
5. Paste your Google AI Studio API key and save.
6. The application automatically detects the secret on the server. Click **Refresh** on the Gemma banner to verify live connectivity.

---

## 🧪 Testing Each Feature

1. **Study Workspace (Gemma 4)**:
   - Click any sample topic pill (e.g., *Computer Networks: TCP vs UDP*).
   - Select **Telugu-English (Latin)** or **Simple English**.
   - Click **Explain Notes**, **Summarize Notes**, or **Generate Quiz**.
   - Answer the multiple-choice questions to test immediate answer feedback and grade tally.
2. **AI Study Chat**:
   - Switch to the **AI Study Chat** tab.
   - Pick a persona (e.g., *Prof. Bennett* or *Alex*).
   - Click a suggested prompt or type a custom question.
3. **Live Voice Tutor**:
   - Switch to the **Live Voice Tutor** tab.
   - Click **Start Voice Session** and allow microphone access.
   - Speak your question and hear the AI tutor respond in real time.
4. **Lecture Transcriber**:
   - Switch to the **Lecture Transcriber** tab.
   - Record with your microphone or upload an audio file.
   - Click **Transcribe to Notes**, then click **Insert into Study Notes** to send the text to the Gemma workspace.
5. **Video Studio**:
   - Switch to the **Video Studio** tab.
   - Choose **Text to Video** or **Animate Image**, pick an aspect ratio (16:9 or 9:16), and review the educational concept preview.
6. **Campus Arcade Game**:
   - Switch to the **Campus Arcade** tab.
   - Press **START EXAM SPRINT**, dodge distractions, collect Knowledge Orbs, and answer the study checkpoint questions!

### Unit Tests
Run the automated test suite in terminal:
```bash
npx tsx --test src/utils/studyLogic.test.ts
```
All 11 unit tests validate notes boundaries, language prompt configuration, JSON quiz parsing, and scoring algorithms.
