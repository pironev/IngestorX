export type ChunkingMode = 'langchain' | 'chonkie' | 'semantic';

export interface SourceDocument {
  sourceUrl: string;
  pageContent: string;
  metadata?: Record<string, unknown>;
}

export interface TextChunk {
  text: string;
  metadata: Record<string, unknown>;
}

export interface TextChunker {
  chunk(document: SourceDocument): Promise<TextChunk[]>;
}

export interface VectorStore {
  ensureCollection(vectorSize: number): Promise<void>;
  upsert(points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>): Promise<void>;
}
