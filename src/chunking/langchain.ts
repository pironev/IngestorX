import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { SourceDocument } from '../types.js';
import type { TextChunk, TextChunker } from './index.js';

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
