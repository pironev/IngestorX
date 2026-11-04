import { Document } from '@langchain/core/documents';
import type { ChunkingMode } from '../types.js';
import type { SourceDocument } from '../types.js';
import { ChonkieChunker } from './chonkie.js';
import { LangChainChunker } from './langchain.js';

export interface TextChunk {
  text: string;
  metadata: Record<string, unknown>;
}

export interface TextChunker {
  chunk(document: SourceDocument): Promise<TextChunk[]>;
}

export function createChunker(
  mode: ChunkingMode,
  chunkSize: number,
  chunkOverlap: number,
): TextChunker {
  if (mode === 'chonkie') {
    return new ChonkieChunker(chunkSize, chunkOverlap);
  }
  return new LangChainChunker(chunkSize, chunkOverlap);
}

export function toLangChainDocument(chunk: TextChunk): Document {
  return new Document({ pageContent: chunk.text, metadata: chunk.metadata });
}
