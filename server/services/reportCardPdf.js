import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fail } from '../utils/errors.js';
export const TEMPLATE_VERSION = 'vedant-a4-v1';
const script = fileURLToPath(new URL('../scripts/report-card-pdf.py', import.meta.url));
const logo = fileURLToPath(new URL('../assets/vedantLogo.png', import.meta.url));
const localPython = fileURLToPath(new URL(process.platform === 'win32' ? '../.reportcard-venv/Scripts/python.exe' : '../.reportcard-venv/bin/python', import.meta.url));
let active = 0;
const queue = [];
async function acquire() {
  if (active < 2) { active++; return; }
  if (queue.length >= 20) fail(503, 'Report generation is busy. Retry shortly');
  await new Promise(resolve => queue.push(resolve));
}
function release() { const next = queue.shift(); if (next) next(); else active--; }
export async function schoolIdentity() {
  return { name: 'Vedant Vidhya Sankul', logoSha256: createHash('sha256').update(await fs.readFile(logo)).digest('hex'), templateVersion: TEMPLATE_VERSION };
}
export async function renderReportCard(snapshot) {
  await acquire();
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(process.env.REPORTCARD_PYTHON || (existsSync(localPython) ? localPython : 'python'), [script], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
      const chunks = []; let size = 0, error = '', settled = false;
      const finish = (err, value) => { if (settled) return; settled = true; clearTimeout(timer); err ? reject(err) : resolve(value); };
      const timer = setTimeout(() => { child.kill(); finish(Object.assign(new Error('PDF generation timed out; retry safely'), { status: 503 })); }, 30000);
      child.on('error', () => finish(Object.assign(new Error('PDF runtime unavailable. Configure REPORTCARD_PYTHON and install the report-card requirements'), { status: 503 })));
      child.stdout.on('data', chunk => { size += chunk.length; if (size > 10 * 1024 * 1024) { child.kill(); finish(Object.assign(new Error('Generated report exceeds PDF size limit'), { status: 422 })); } else chunks.push(chunk); });
      child.stderr.on('data', chunk => { if (error.length < 4000) error += chunk.toString(); });
      child.on('close', code => { const buffer = Buffer.concat(chunks); if (code !== 0 || !buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) finish(Object.assign(new Error(error.includes('Unsupported text') ? 'Report contains text not supported by the configured PDF font; configure a matching Unicode font before issuing' : 'PDF generation failed. Check the configured Python runtime and font; no card was issued'), { status: 422 })); else finish(null, buffer); });
      child.stdin.on('error', () => {});
      child.stdin.end(JSON.stringify(snapshot));
    });
  } finally { release(); }
}
