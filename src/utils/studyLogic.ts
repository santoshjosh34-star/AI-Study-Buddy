/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LanguageOption =
  | 'simple-english'
  | 'telugu-english'
  | 'hindi-english'
  | 'tamil-english'
  | 'telugu-script'
  | 'hindi-script'
  | 'spanish';

export type StudyAction = 'explain' | 'summarize' | 'quiz';

export interface LanguageConfig {
  id: LanguageOption;
  name: string;
  badge: string;
  badgeClass: string;
  category: 'Bilingual (Latin Script)' | 'Native Script' | 'International';
  description: string;
  ttsLang: string;
  sample: string;
}

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    id: 'simple-english',
    name: 'Simple English',
    badge: 'Global',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    category: 'International',
    description: 'Clear, plain English with intuitive analogies and simplified jargon.',
    ttsLang: 'en-US',
    sample: 'Clear, friendly academic breakdown',
  },
  {
    id: 'telugu-english',
    name: 'Telugu-English (Latin)',
    badge: 'Tenglish',
    badgeClass: 'bg-amber-100 text-amber-800',
    category: 'Bilingual (Latin Script)',
    description: 'Conversational Telugu written in English alphabet (e.g., "Ee concept exam ki chala important...").',
    ttsLang: 'en-IN',
    sample: 'Ee concept exam lo 10 marks question ga ravochu...',
  },
  {
    id: 'hindi-english',
    name: 'Hindi-English (Latin)',
    badge: 'Hinglish',
    badgeClass: 'bg-orange-100 text-orange-800',
    category: 'Bilingual (Latin Script)',
    description: 'Conversational Hindi written in English letters (e.g., "Yeh topic exam ke liye bohot crucial hai...").',
    ttsLang: 'en-IN',
    sample: 'Yeh topic samajhna bohot aasan hai...',
  },
  {
    id: 'tamil-english',
    name: 'Tamil-English (Latin)',
    badge: 'Tanglish',
    badgeClass: 'bg-purple-100 text-purple-800',
    category: 'Bilingual (Latin Script)',
    description: 'Conversational Tamil written in English letters (e.g., "Indha concept exam point of view la romba mukkiyam...").',
    ttsLang: 'en-IN',
    sample: 'Indha concept romba simple and high scoring...',
  },
  {
    id: 'telugu-script',
    name: 'Telugu (తెలుగు లిపి)',
    badge: 'తెలుగు',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    category: 'Native Script',
    description: 'Pure Telugu script explanation with English technical terms preserved for university exams.',
    ttsLang: 'te-IN',
    sample: 'స్పష్టమైన తెలుగు వివరణ (సాంకేతిక పదాలతో)...',
  },
  {
    id: 'hindi-script',
    name: 'Hindi (हिंदी देवनागरी)',
    badge: 'हिंदी',
    badgeClass: 'bg-rose-100 text-rose-800',
    category: 'Native Script',
    description: 'Pure Hindi Devanagari script with English technical nouns for clarity.',
    ttsLang: 'hi-IN',
    sample: 'सरल हिंदी में विस्तृत और सटीक व्याख्या...',
  },
  {
    id: 'spanish',
    name: 'Simple Spanish (Español)',
    badge: 'Español',
    badgeClass: 'bg-teal-100 text-teal-800',
    category: 'International',
    description: 'Explicación sencilla y académica en español para estudiantes universitarios.',
    ttsLang: 'es-ES',
    sample: 'Explicación clara paso a paso con analogías...',
  },
];

export function getLanguageConfig(id: LanguageOption): LanguageConfig {
  return LANGUAGE_CONFIGS.find((l) => l.id === id) || LANGUAGE_CONFIGS[0];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // 0, 1, 2, 3
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  grade: string;
  feedback: string;
}

export interface ModelStatusResponse {
  isKeyConfigured: boolean;
  currentModel: string;
  availableGemmaModels: string[];
  isOpenWeight: boolean;
  isGemmaAvailable: boolean;
  message: string;
}

export const MAX_NOTES_LENGTH = 8000;

/**
 * Validates user study notes input
 */
export function validateNotes(
  text: string,
  maxLength: number = MAX_NOTES_LENGTH
): {
  isValid: boolean;
  error?: string;
  charCount: number;
  wordCount: number;
} {
  const trimmed = text.trim();
  const charCount = text.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter or paste your study notes to get started.',
      charCount: 0,
      wordCount: 0,
    };
  }

  if (charCount > maxLength) {
    return {
      isValid: false,
      error: `Notes length (${charCount.toLocaleString()} chars) exceeds the maximum limit of ${maxLength.toLocaleString()} characters. Please trim your text.`,
      charCount,
      wordCount,
    };
  }

  return {
    isValid: true,
    charCount,
    wordCount,
  };
}

function getLanguageGuidelines(
  language: LanguageOption,
  task: 'explain' | 'summarize' | 'quiz'
): { instruction: string; targetLangDescription: string } {
  switch (language) {
    case 'telugu-english':
      return {
        instruction:
          'Language: Telugu-English (conversational colloquial Telugu written strictly in Latin/English letters, Tenglish). Keep technical academic terms (e.g., Process, Thread, Deadlock, Memory) in English so students can write exams effectively.',
        targetLangDescription: 'Telugu-English (Latin letters, Tenglish)',
      };
    case 'hindi-english':
      return {
        instruction:
          'Language: Hindi-English (conversational colloquial Hindi written strictly in Latin/English letters, Hinglish). Keep technical academic terms (e.g., Process, Thread, Deadlock, Memory) in English.',
        targetLangDescription: 'Hindi-English (Latin letters, Hinglish)',
      };
    case 'tamil-english':
      return {
        instruction:
          'Language: Tamil-English (conversational colloquial Tamil written strictly in Latin/English letters, Tanglish). Keep technical academic terms (e.g., Process, Thread, Deadlock, Memory) in English.',
        targetLangDescription: 'Tamil-English (Latin letters, Tanglish)',
      };
    case 'telugu-script':
      return {
        instruction:
          'Language: Pure Telugu script (తెలుగు లిపి). Provide clear, beautiful Telugu explanations while including key technical terms in English or brackets for college exam precision.',
        targetLangDescription: 'Telugu Script (తెలుగు లిపి)',
      };
    case 'hindi-script':
      return {
        instruction:
          'Language: Pure Hindi script (हिंदी देवनागरी). Provide clear, natural Hindi explanations while preserving key technical terms in English or brackets for college exam precision.',
        targetLangDescription: 'Hindi Devanagari Script (हिंदी)',
      };
    case 'spanish':
      return {
        instruction:
          'Language: Simple Spanish (Español claro y accesible). Use friendly, clear Spanish suitable for college students with simplified technical explanations.',
        targetLangDescription: 'Simple Spanish (Español)',
      };
    default:
      return {
        instruction:
          'Language: Clear, intuitive Simple English. Eliminate dense academic jargon with intuitive real-world analogies.',
        targetLangDescription: 'Simple English',
      };
  }
}

/**
 * Prompt builder for "Explain Notes"
 */
export function buildExplainPrompt(notes: string, language: LanguageOption): string {
  const guide = getLanguageGuidelines(language, 'explain');

  return `You are "AI Study Buddy", an expert college tutor who explains complex university subjects in clear, intuitive, engaging language.
${guide.instruction}

Structure your response cleanly using markdown with clear headings:
1. 📌 Core Concept in Simple Words
2. 🔍 Step-by-Step Breakdown
3. 💡 Intuitive Real-World Analogy (Relatable college/daily life example)
4. 🎯 High-Yield Exam Takeaways (Key points to memorize for exams)

Here are the student's study notes:
"""
${notes}
"""

Provide the complete explanation now in ${guide.targetLangDescription}.`;
}

/**
 * Prompt builder for "Summarize Notes"
 */
export function buildSummarizePrompt(notes: string, language: LanguageOption): string {
  const guide = getLanguageGuidelines(language, 'summarize');

  return `You are "AI Study Buddy". Summarize the following college study notes into crisp, high-retention revision notes.
${guide.instruction}

Structure the summary into:
1. ⚡ TL;DR Summary (2-3 concise sentences)
2. 🔑 Core Takeaways (Crisp, bulleted conceptual points)
3. 📖 Essential Terminology & Definitions (Must-know academic terms and formulas)
4. ⏰ 5-Minute Exam Revision Checklist (High-yield points)

Here are the notes:
"""
${notes}
"""

Provide the structured summary now in ${guide.targetLangDescription}.`;
}

/**
 * Prompt builder for "Generate Quiz"
 */
export function buildQuizPrompt(notes: string, language: LanguageOption, questionCount: number = 4): string {
  const guide = getLanguageGuidelines(language, 'quiz');

  return `You are "AI Study Buddy". Generate ${questionCount} high-quality college practice multiple-choice questions based ONLY on the provided study notes.

${guide.instruction}
For non-English or bilingual languages, the questions and explanations should be in ${guide.targetLangDescription}, while the technical options remain clear and precise.

IMPORTANT: You must output ONLY a valid JSON array of objects, with NO surrounding conversational commentary, no markdown codeblocks before or after other than standard \`\`\`json.
Each object in the array MUST strictly have:
- "id": integer starting from 1
- "question": string (clear question testing conceptual understanding)
- "options": array of 4 distinct string choices [A, B, C, D]
- "correctIndex": integer index of the correct answer (0 for option 1, 1 for option 2, 2 for option 3, 3 for option 4)
- "explanation": string explaining why that specific option is correct and why the other options are wrong or less optimal.

Example JSON format:
[
  {
    "id": 1,
    "question": "What is the primary function of an Operating System?",
    "options": [
      "To compile high-level source code into bytecode",
      "To manage computer hardware and provide services for applications",
      "To design database relational schemas",
      "To perform direct internet packet routing"
    ],
    "correctIndex": 1,
    "explanation": "An OS acts as an intermediary between user applications and the hardware."
  }
]

Here are the study notes to test:
"""
${notes}
"""

Generate the JSON array of ${questionCount} multiple-choice questions now:`;
}

/**
 * Safely parses Quiz JSON generated by Gemma
 */
export function parseQuizJson(rawText: string): QuizQuestion[] {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.trim();

  // Find the first '[' and last ']' if extra text surrounds the JSON
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Parsed response is not a valid list of quiz questions.');
  }

  return parsed.map((item: any, idx: number): QuizQuestion => {
    const id = typeof item.id === 'number' ? item.id : idx + 1;
    const question = String(item.question || `Question ${id}`);
    const rawOptions = Array.isArray(item.options) ? item.options : [];
    const options = rawOptions.map((opt: any) => String(opt).trim()).slice(0, 4);

    if (options.length < 2) {
      throw new Error(`Question ${id} does not contain enough options.`);
    }

    let correctIndex = Number(item.correctIndex);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      correctIndex = 0; // safe fallback
    }

    const explanation = String(
      item.explanation || 'Review the study notes to deepen your understanding of this topic.'
    );

    return {
      id,
      question,
      options,
      correctIndex,
      explanation,
    };
  });
}

/**
 * Calculates quiz score and provides college-level feedback
 */
export function calculateQuizScore(
  userAnswers: Record<number, number>,
  questions: QuizQuestion[]
): QuizResult {
  const total = questions.length;
  if (total === 0) {
    return {
      score: 0,
      total: 0,
      percentage: 0,
      passed: false,
      grade: 'N/A',
      feedback: 'No questions answered.',
    };
  }

  let score = 0;
  questions.forEach((q) => {
    if (userAnswers[q.id] === q.correctIndex) {
      score += 1;
    }
  });

  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;

  let grade = 'F';
  let feedback = 'Needs revision. Review your notes and try again!';

  if (percentage === 100) {
    grade = 'A+';
    feedback = 'Outstanding! You have mastered this concept completely!';
  } else if (percentage >= 80) {
    grade = 'A';
    feedback = 'Great job! Strong conceptual understanding for college exams.';
  } else if (percentage >= 60) {
    grade = 'B';
    feedback = 'Good effort! Review the explanations for the ones you missed.';
  }

  return {
    score,
    total,
    percentage,
    passed,
    grade,
    feedback,
  };
}

/**
 * Rich, authentic college study sample topics for instant testing
 */
export interface SampleTopic {
  title: string;
  subject: string;
  content: string;
}

export const SAMPLE_TOPICS: SampleTopic[] = [
  {
    title: 'Computer Networks: TCP vs UDP',
    subject: 'Computer Science',
    content: `Transmission Control Protocol (TCP) and User Datagram Protocol (UDP) are the two primary transport layer protocols in the Internet protocol suite.

1. TCP (Transmission Control Protocol):
- Connection-Oriented: Establishes a 3-way handshake (SYN, SYN-ACK, ACK) before data transfer begins.
- Reliability: Guarantees delivery via packet acknowledgments, sequence numbers, and automatic retransmissions for lost packets.
- Flow & Congestion Control: Uses sliding window algorithms and congestion avoidance (e.g., slow start) to prevent network buffer overflow.
- Overhead & Latency: Slower due to 20-byte header overhead and handshake latency.
- Common Use Cases: Web browsing (HTTP/HTTPS), email (SMTP/IMAP), file transfer (FTP), and SSH.

2. UDP (User Datagram Protocol):
- Connectionless: Sends datagrams directly without prior connection setup.
- Unreliable (Best-Effort): No acknowledgments, no guaranteed order, and no retransmission of dropped packets.
- Lightweight & Fast: Minimal 8-byte header with almost zero latency overhead.
- Common Use Cases: Live video streaming, DNS lookups, VoIP calls, online multiplayer gaming, and real-time sensor telemetry.`,
  },
  {
    title: 'DBMS: ACID Properties & Normalization',
    subject: 'Database Systems',
    content: `In relational database management systems (RDBMS), ACID properties ensure reliable transaction processing even in the event of power failures or crashes.

1. ACID Properties:
- Atomicity: "All or nothing". Either the entire transaction succeeds, or all changes are rolled back to the initial state.
- Consistency: The database must transition from one valid state to another, strictly adhering to all constraints (keys, cascades, triggers).
- Isolation: Concurrent transactions execute independently without interfering with each other's intermediate uncommitted states.
- Durability: Once a transaction commits, its modifications are permanently recorded on non-volatile disk storage even after a system crash.

2. Database Normalization:
- 1st Normal Form (1NF): Eliminates repeating groups; every column contains atomic (indivisible) values.
- 2nd Normal Form (2NF): Must be in 1NF and eliminate partial dependencies (all non-key attributes must depend on the whole primary key).
- 3rd Normal Form (3NF): Must be in 2NF and eliminate transitive dependencies (non-key attributes must not depend on other non-key attributes).`,
  },
  {
    title: 'Operating Systems: Process vs Thread & Deadlocks',
    subject: 'Operating Systems',
    content: `Operating systems coordinate hardware resources and multitasking through processes and threads.

1. Process vs Thread:
- Process: An independent executing program with its own dedicated memory address space, file handles, and security context. Process creation is resource-heavy.
- Thread: A lightweight unit of execution within a parent process. Multiple threads share the same code, data, and heap memory, but maintain private stacks and program counters. Inter-thread communication is faster than inter-process communication (IPC).

2. Deadlocks:
A deadlock is a permanent standstill where two or more processes cannot proceed because each is holding a resource and waiting for another resource held by the other.
Coffman's 4 Necessary Conditions for Deadlock:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process holds resources while requesting new ones.
3. No Preemption: Resources cannot be forcibly seized; only released voluntarily.
4. Circular Wait: A closed loop where P0 waits for P1, P1 waits for P2, and Pn waits for P0.`,
  },
  {
    title: 'Cell Biology: DNA Replication & Central Dogma',
    subject: 'Life Sciences',
    content: `The Central Dogma of Molecular Biology explains the flow of genetic information: DNA -> RNA -> Protein.

1. DNA Replication (Semi-Conservative):
- Helicase: Unzips the double-stranded DNA helix at the replication fork by breaking hydrogen bonds between base pairs (A-T, G-C).
- Single-Stranded Binding Proteins (SSBs): Stabilize single strands to prevent re-annealing.
- Primase: Synthesizes short RNA primers to provide a 3'-OH starting point.
- DNA Polymerase III: Synthesizes new complementary DNA strands continuously on the leading strand and discontinuously on the lagging strand (forming Okazaki fragments).
- DNA Ligase: Seals phosphodiester nicks between Okazaki fragments.

2. Central Dogma:
- Transcription: RNA Polymerase reads the template DNA strand to synthesize messenger RNA (mRNA) in the nucleus.
- Translation: Ribosomes read mRNA codons in the cytoplasm, and transfer RNA (tRNA) delivers matching amino acids to synthesize polypeptide protein chains.`,
  },
];
