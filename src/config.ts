import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  qdrantUrl: process.env.QDRANT_URL ?? 'http://localhost:6333',
  qdrantApiKey: process.env.QDRANT_API_KEY ?? '',
  qdrantCollection: process.env.QDRANT_COLLECTION ?? 'docs_chunks',
  chunkingMode: (process.env.CHUNKING_MODE ?? 'semantic').toLowerCase(),
  chunkSize: Number(process.env.CHUNK_SIZE ?? 800),
  chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? 120),
  batchSize: Number(process.env.INGEST_BATCH_SIZE ?? 64),
};

export function assertConfig() {
  if (!config.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  if (!Number.isInteger(config.chunkSize) || config.chunkSize <= 0) {
    throw new Error('CHUNK_SIZE must be a positive integer.');
  }

  if (!Number.isInteger(config.chunkOverlap) || config.chunkOverlap < 0 || config.chunkOverlap >= config.chunkSize) {
    throw new Error('CHUNK_OVERLAP must be an integer >= 0 and smaller than CHUNK_SIZE.');
  }

  if (!Number.isInteger(config.batchSize) || config.batchSize <= 0) {
    throw new Error('INGEST_BATCH_SIZE must be a positive integer.');
  }

  if (!['langchain', 'chonkie', 'semantic'].includes(config.chunkingMode)) {
    throw new Error('CHUNKING_MODE must be one of: langchain, chonkie, semantic.');
  }
}
