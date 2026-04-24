#!/usr/bin/env node
/**
 * 驗證 event-scraper.ts 使用的 Gemini 模型是否全部可用
 * 用法：node scripts/test-gemini-models.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envText = readFileSync(envPath, 'utf8');

const apiKeys = [1, 2, 3, 4, 5, 6]
  .map((n) => envText.match(new RegExp(`^GOOGLE_GEMINI_API_KEY_${n}=(.+)$`, 'm'))?.[1]?.trim())
  .filter(Boolean);

if (apiKeys.length === 0) {
  console.error('No Gemini API keys found in .env.local');
  process.exit(1);
}

console.log(`Loaded ${apiKeys.length} API key(s)\n`);

// 與 src/lib/event-scraper.ts 的 GEMINI_MODELS 保持一致（適配 Vercel Hobby 60s 限制）
const MODELS = [
  { name: 'gemini-3.1-flash-lite-preview', timeoutMs: 15000 },
  { name: 'gemini-2.5-flash-lite',          timeoutMs: 15000 },
  { name: 'gemini-3-flash-preview',         timeoutMs: 20000 },
  { name: 'gemini-2.5-flash',               timeoutMs: 20000 },
  { name: 'gemini-3.1-pro-preview',         timeoutMs: 25000 },
  { name: 'gemini-2.5-pro',                 timeoutMs: 25000 },
];

const prompt = '回傳純 JSON：{"ok": true, "model": "你是什麼模型"}';

async function testModel(model, apiKey, timeoutMs) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text();
      return { status: 'FAIL', code: response.status, detail: text.substring(0, 150) };
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) return { status: 'EMPTY', detail: 'no content returned' };

    return { status: 'OK', reply: reply.substring(0, 120) };
  } catch (err) {
    return { status: 'ERROR', detail: err.message };
  }
}

console.log('Testing each model with the first key (per-model timeout 15-25s)...\n');
for (const { name, timeoutMs } of MODELS) {
  process.stdout.write(`[${name.padEnd(36)}] `);
  const start = Date.now();
  const result = await testModel(name, apiKeys[0], timeoutMs);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  if (result.status === 'OK') {
    console.log(`✓ OK (${elapsed}s)  ${result.reply.replace(/\s+/g, ' ')}`);
  } else if (result.status === 'FAIL') {
    console.log(`✗ HTTP ${result.code} (${elapsed}s)  ${result.detail.replace(/\s+/g, ' ').substring(0, 100)}`);
  } else {
    console.log(`✗ ${result.status} (${elapsed}s)  ${result.detail}`);
  }
}
