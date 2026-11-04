import { config } from '../config.js';

export type ChunkingMode = 'langchain' | 'chonkie';

export interface SourceDocument {
  sourceUrl: string;
  pageContent: string;
  metadata?: Record<string, unknown>;
}

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

/** Implement this contract to add a vector database without changing ingestion. */
export interface VectorStore {
  ensureCollection(vectorSize: number): Promise<void>;
  upsert(points: VectorPoint[]): Promise<void>;
  search(vector: number[], limit: number): Promise<VectorSearchResult[]>;
}

export function assertConfig(): void {
  if (!config.openAiApiKey) throw new Error('OPENAI_API_KEY is required.');
  if (!Number.isInteger(config.chunkSize) || config.chunkSize <= 0) {
    throw new Error('CHUNK_SIZE must be a positive integer.');
  }
  if (!Number.isInteger(config.chunkOverlap) || config.chunkOverlap < 0 || config.chunkOverlap >= config.chunkSize) {
    throw new Error('CHUNK_OVERLAP must be an integer >= 0 and smaller than CHUNK_SIZE.');
  }
  if (!Number.isInteger(config.batchSize) || config.batchSize <= 0) {
    throw new Error('INGEST_BATCH_SIZE must be a positive integer.');
  }
  if (config.chunkingMode !== 'langchain' && config.chunkingMode !== 'chonkie') {
    throw new Error('CHUNKING_MODE must be either "langchain" or "chonkie".');
  }
}
