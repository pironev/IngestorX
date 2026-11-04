#!/usr/bin/env node
import { ingestUrl } from './ingest.js';

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: npm run ingest -- <https://example.com>');
    process.exit(1);
  }

  try {
    const result = await ingestUrl(url);
    console.log('Ingest successful:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Ingest failed:', error);
    process.exit(1);
  }
}

void main();
