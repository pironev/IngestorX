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
