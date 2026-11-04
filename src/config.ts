import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  qdrantUrl: process.env.QDRANT_URL ?? 'http://localhost:6333',
  qdrantApiKey: process.env.QDRANT_API_KEY ?? '',
  qdrantCollection: process.env.QDRANT_COLLECTION ?? 'docs_chunks',
  chunkingMode: (process.env.CHUNKING_MODE ?? 'langchain').toLowerCase(),
  chunkSize: Number(process.env.CHUNK_SIZE ?? 800),
  chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? 120),
};

export function assertConfig() {
  if (!config.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  if (!config.qdrantUrl) {
    throw new Error('QDRANT_URL is required.');
  }
}
