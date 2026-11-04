export type ChunkingMode = 'langchain' | 'chonkie';

export interface SourceDocument {
  sourceUrl: string;
  pageContent: string;
  metadata?: Record<string, unknown>;
}

export interface StoredChunk {
  id: string;
  sourceUrl: string;
  chunkIndex: number;
  text: string;
  vector: number[];
  createdAt: string;
}

export interface VectorStore {
  ensureCollection(vectorSize: number): Promise<void>;
  upsert(points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>): Promise<void>;
}
