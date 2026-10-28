/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateNotes,
  buildExplainPrompt,
  buildSummarizePrompt,
  buildQuizPrompt,
  parseQuizJson,
  calculateQuizScore,
  MAX_NOTES_LENGTH,
  LANGUAGE_CONFIGS,
} from './studyLogic';

test('validateNotes correctly validates empty inputs', () => {
  const resultEmpty = validateNotes('');
  assert.equal(resultEmpty.isValid, false);
  assert.equal(resultEmpty.charCount, 0);
  assert.equal(resultEmpty.wordCount, 0);
  assert.match(resultEmpty.error || '', /Please enter or paste your study notes/);

  const resultWhitespace = validateNotes('   \n\t  ');
  assert.equal(resultWhitespace.isValid, false);
});

test('validateNotes accepts valid notes and calculates counts', () => {
  const sample = 'TCP is a reliable connection-oriented transport protocol.';
  const result = validateNotes(sample);
  assert.equal(result.isValid, true);
  assert.equal(result.charCount, sample.length);
  assert.equal(result.wordCount, 7);
  assert.equal(result.error, undefined);
});

test('validateNotes rejects notes exceeding max length', () => {
  const hugeText = 'A'.repeat(MAX_NOTES_LENGTH + 50);
  const result = validateNotes(hugeText);
  assert.equal(result.isValid, false);
  assert.match(result.error || '', /exceeds the maximum limit/);
});

test('buildExplainPrompt configures Telugu-English Latin script instructions', () => {
  const prompt = buildExplainPrompt('Deadlock occurs when...', 'telugu-english');
  assert.match(prompt, /Telugu-English/);
  assert.match(prompt, /Latin letters/);
  assert.match(prompt, /Tenglish/);
  assert.match(prompt, /Core Concept in Simple Words/);
});

test('buildExplainPrompt configures Simple English instructions', () => {
  const prompt = buildExplainPrompt('Deadlock occurs when...', 'simple-english');
  assert.match(prompt, /Simple English/);
  assert.match(prompt, /Intuitive Real-World Analogy/);
});

test('LANGUAGE_CONFIGS contains all supported bilingual and regional languages', () => {
  const ids = [
    'simple-english',
    'telugu-english',
    'hindi-english',
    'tamil-english',
    'telugu-script',
    'hindi-script',
    'spanish',
  ];
  ids.forEach((id) => {
    const config = LANGUAGE_CONFIGS.find((c) => c.id === id);
    assert.ok(config, `Missing config for ${id}`);
    assert.ok(config.name.length > 0);
    assert.ok(config.badge.length > 0);
  });
});

test('buildExplainPrompt supports Hinglish, Tanglish, and native scripts', () => {
  const promptHiEn = buildExplainPrompt('DBMS notes', 'hindi-english');
  assert.match(promptHiEn, /Hindi-English/);
  assert.match(promptHiEn, /Hinglish/);

  const promptTaEn = buildExplainPrompt('OS notes', 'tamil-english');
  assert.match(promptTaEn, /Tamil-English/);
  assert.match(promptTaEn, /Tanglish/);

  const promptTeScript = buildExplainPrompt('Networks notes', 'telugu-script');
  assert.match(promptTeScript, /తెలుగు లిపి/);

  const promptEs = buildExplainPrompt('Economics notes', 'spanish');
  assert.match(promptEs, /Simple Spanish/);
});

test('buildSummarizePrompt generates structured summary sections', () => {
  const promptEn = buildSummarizePrompt('Sample notes', 'simple-english');
  assert.match(promptEn, /TL;DR Summary/);
  assert.match(promptEn, /Core Takeaways/);

  const promptTe = buildSummarizePrompt('Sample notes', 'telugu-english');
  assert.match(promptTe, /TL;DR Summary/);
  assert.match(promptTe, /Core Takeaways/);
});

test('buildQuizPrompt requires structured JSON array', () => {
  const prompt = buildQuizPrompt('Sample notes', 'simple-english', 4);
  assert.match(prompt, /valid JSON array/);
  assert.match(prompt, /correctIndex/);
  assert.match(prompt, /4 distinct string choices/);
});

test('parseQuizJson handles clean JSON and markdown fences', () => {
  const rawWithMarkdown = `
\`\`\`json
[
  {
    "id": 1,
    "question": "What is the 3-way handshake in TCP?",
    "options": ["SYN, SYN-ACK, ACK", "GET, POST, PUT", "PING, PONG, ECHO", "START, RUN, STOP"],
    "correctIndex": 0,
    "explanation": "TCP establishes connections using SYN, SYN-ACK, ACK."
  },
  {
    "id": 2,
    "question": "Which protocol is connectionless?",
    "options": ["TCP", "UDP", "FTP", "BGP"],
    "correctIndex": 1,
    "explanation": "UDP sends datagrams without establishing a connection."
  }
]
\`\`\`
  `;

  const parsed = parseQuizJson(rawWithMarkdown);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].id, 1);
  assert.equal(parsed[0].correctIndex, 0);
  assert.equal(parsed[0].options.length, 4);
  assert.equal(parsed[1].options[1], 'UDP');
  assert.equal(parsed[1].correctIndex, 1);
});

test('calculateQuizScore computes scores, grades, and feedback', () => {
  const mockQuestions = [
    {
      id: 1,
      question: 'Q1',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'Exp1',
    },
    {
      id: 2,
      question: 'Q2',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 2,
      explanation: 'Exp2',
    },
  ];

  // 100% correct
  const resultPerfect = calculateQuizScore({ 1: 0, 2: 2 }, mockQuestions);
  assert.equal(resultPerfect.score, 2);
  assert.equal(resultPerfect.total, 2);
  assert.equal(resultPerfect.percentage, 100);
  assert.equal(resultPerfect.grade, 'A+');
  assert.equal(resultPerfect.passed, true);

  // 50% correct
  const resultHalf = calculateQuizScore({ 1: 0, 2: 0 }, mockQuestions);
  assert.equal(resultHalf.score, 1);
  assert.equal(resultHalf.total, 2);
  assert.equal(resultHalf.percentage, 50);
  assert.equal(resultHalf.grade, 'F');
  assert.equal(resultHalf.passed, false);
});
