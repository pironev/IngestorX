#!/usr/bin/env node
import { ingestUrl } from './ingest.js';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: npm run ingest -- <https://example.com>');
    process.exitCode = 1;
    return;
  }

  try {
    console.log('Ingest successful:', JSON.stringify(await ingestUrl(url), null, 2));
  } catch (error) {
    console.error('Ingest failed:', error);
    process.exitCode = 1;
  }
}

void main();
