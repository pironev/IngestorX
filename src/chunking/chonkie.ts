import { TokenChunker } from '@chonkiejs/core';
import type { SourceDocument } from '../types.js';
import type { TextChunk, TextChunker } from './index.js';

export class ChonkieChunker implements TextChunker {
  constructor(
    private readonly chunkSize: number,
    private readonly chunkOverlap: number,
  ) {}

  async chunk(document: SourceDocument): Promise<TextChunk[]> {
    const chunker = await TokenChunker.create({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      tokenizer: 'character',
    });
    const chunks = await chunker.chunk(document.pageContent);

    return chunks
      .map((chunk, chunkIndex) => ({
        text: chunk.text.trim(),
        metadata: {
          ...document.metadata,
          sourceUrl: document.sourceUrl,
          chunkIndex,
          tokenCount: chunk.tokenCount,
          chunker: 'chonkie-token',
        },
      }))
      .filter((chunk) => chunk.text.length > 0);
  }
}
