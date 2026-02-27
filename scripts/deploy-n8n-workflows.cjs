#!/usr/bin/env node
/**
 * Deploy TradeBuddy n8n workflows via n8n API.
 * Uses workflows from repo root; naming and tags per n8n-mcp practices.
 * Run from project root: node scripts/deploy-n8n-workflows.cjs
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

const WORKFLOWS = [
  { file: 'n8n-telegram-ict-workflow.json', activate: true },
  { file: 'n8n-youtube-playlist-rag-ingestion-workflow.json', activate: false },
];

function request(method, urlPath, body = null) {
  const url = new URL(urlPath, N8N_BASE_URL);
  const isHttps = url.protocol === 'https:';
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY || '',
    },
  };
  if (body) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));

  return new Promise((resolve, reject) => {
    const req = (isHttps ? https : http).request(url, options, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) reject(new Error(parsed.message || data || res.statusCode));
          else resolve(parsed);
        } catch (e) {
          if (res.statusCode >= 400) reject(new Error(data || res.statusCode));
          else resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function preparePayload(wf) {
  const { name, nodes, connections, settings } = wf;
  return { name, nodes, connections, settings: settings || { executionOrder: 'v1' } };
}

async function main() {
  if (!N8N_API_KEY) {
    console.error('N8N_API_KEY not set in backend/.env');
    process.exit(1);
  }
  const root = path.join(__dirname, '..');
  let telegramId = null;

  for (const { file, activate } of WORKFLOWS) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) {
      console.warn('Skip (not found):', file);
      continue;
    }
    const wf = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const payload = preparePayload(wf);
    const displayName = payload.name;

    try {
      const list = await request('GET', '/api/v1/workflows');
      const existing = (list.data || list).find((w) => w.name === displayName);
      if (existing) {
        const update = { name: payload.name, nodes: payload.nodes, connections: payload.connections, settings: payload.settings };
        await request('PUT', `/api/v1/workflows/${existing.id}`, update);
        console.log('Updated:', displayName, '(id:', existing.id + ')');
        if (activate) telegramId = existing.id;
      } else {
        const created = await request('POST', '/api/v1/workflows', payload);
        const id = created.id;
        console.log('Created:', displayName, '(id:', id + ')');
        if (activate) telegramId = id;
      }
    } catch (e) {
      console.error('Failed', file, e.message);
    }
  }

  if (telegramId) {
    try {
      await request('POST', `/api/v1/workflows/${telegramId}/activate`);
      console.log('Activated: TradeBuddy – Telegram ICT Advisor');
    } catch (e) {
      console.warn('Activate failed:', e.message);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
