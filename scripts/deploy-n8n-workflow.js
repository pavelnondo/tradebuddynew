#!/usr/bin/env node
/**
 * Deploy TradeBuddy AI Insights workflow to n8n via the n8n API.
 * Uses N8N_API_KEY and N8N_BASE_URL from backend/.env
 *
 * Run: node scripts/deploy-n8n-workflow.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const N8N_BASE_URL = (process.env.N8N_BASE_URL || 'http://localhost:5678').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error('N8N_API_KEY is required in backend/.env');
  process.exit(1);
}

const workflowPath = path.join(__dirname, '../n8n-tradebuddy-ai-insights-workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Prepare payload for n8n API (only fields it expects)
const settings = workflow.settings || {};
const payload = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: { executionOrder: settings.executionOrder || 'v1' },
  staticData: workflow.staticData || null,
};

async function deploy() {
  console.log('Deploying workflow to n8n at', N8N_BASE_URL);

  // Check if workflow exists
  const listRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    console.error('Failed to list workflows:', listRes.status, err);
    process.exit(1);
  }

  const listData = await listRes.json();
  const workflows = listData.data ?? listData.workflows ?? listData ?? [];
  const list = Array.isArray(workflows) ? workflows : [];
  const existing = list.find((w) => w.name === workflow.name);

  if (existing) {
    console.log('Updating existing workflow', existing.id);
    const updateRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${existing.id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      console.error('Failed to update workflow:', updateRes.status, err);
      process.exit(1);
    }

    const updated = await updateRes.json();
    console.log('Workflow updated. ID:', updated.data?.id);

    // Activate
    const activateRes = await fetch(
      `${N8N_BASE_URL}/api/v1/workflows/${existing.id}/activate`,
      {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      }
    );
    if (activateRes.ok) {
      console.log('Workflow activated.');
    }
  } else {
    console.log('Creating new workflow');
    const createRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Failed to create workflow:', createRes.status, err);
      process.exit(1);
    }

    const created = await createRes.json();
    const id = created.data?.id ?? created.id;
    console.log('Workflow created. ID:', id ?? '(see n8n UI)');

    // Activate
    if (id) {
      const activateRes = await fetch(
        `${N8N_BASE_URL}/api/v1/workflows/${id}/activate`,
        {
          method: 'POST',
          headers: { 'X-N8N-API-KEY': N8N_API_KEY },
        }
      );
      if (activateRes.ok) {
        console.log('Workflow activated.');
      }
    }
  }

  console.log('Webhook URL:', `${N8N_BASE_URL}/webhook/tradebuddy-insights`);
}

deploy().catch((err) => {
  console.error(err);
  process.exit(1);
});
