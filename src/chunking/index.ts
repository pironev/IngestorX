import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { TokenChunker } from '@chonkiejs/core';
import type { ChunkingMode, SourceDocument, TextChunk, TextChunker } from '../types.js';
import { SemanticChunker } from './semantic.js';

export class LangChainChunker implements TextChunker {
  private readonly splitter: RecursiveCharacterTextSplitter;

  constructor(chunkSize: number, chunkOverlap: number) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
    });
  }

  async chunk(document: SourceDocument): Promise<TextChunk[]> {
    const docs = await this.splitter.createDocuments(
      [document.pageContent],
      [{ ...(document.metadata ?? {}), sourceUrl: document.sourceUrl }],
    );

    return docs
      .map((chunk, chunkIndex) => ({
        text: chunk.pageContent.trim(),
        metadata: {
          ...chunk.metadata,
          chunkIndex,
          chunker: 'langchain-recursive',
        },
      }))
      .filter((chunk) => chunk.text.length > 0);
  }
}

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
          ...(document.metadata ?? {}),
          sourceUrl: document.sourceUrl,
          chunkIndex,
          tokenCount: chunk.tokenCount,
          chunker: 'chonkie-token',
        },
      }))
      .filter((chunk) => chunk.text.length > 0);
  }
}

export function createChunker(mode: ChunkingMode, chunkSize: number, chunkOverlap: number): TextChunker {
  if (mode === 'semantic') {
    return new SemanticChunker(chunkSize, chunkOverlap);
  }

  if (mode === 'chonkie') {
    return new ChonkieChunker(chunkSize, chunkOverlap);
  }

  return new LangChainChunker(chunkSize, chunkOverlap);
}

export async function chunkDocuments(
  documents: SourceDocument[],
  mode: ChunkingMode,
  chunkSize: number,
  chunkOverlap: number,
): Promise<string[]> {
  const chunker = createChunker(mode, chunkSize, chunkOverlap);
  const allChunks = await Promise.all(documents.map((document) => chunker.chunk(document)));
  return allChunks.flat().map((chunk) => chunk.text);
}
