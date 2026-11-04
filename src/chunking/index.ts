import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { ChunkingMode, SourceDocument } from '../types.js';

export async function chunkDocuments(
  documents: SourceDocument[],
  mode: ChunkingMode,
  chunkSize: number,
  chunkOverlap: number,
): Promise<string[]> {
  if (mode === 'chonkie') {
    // Placeholder for Chonkie.js integration.
    // Example:
    // const chunks = await chonkieChunk(documents.map(d => d.pageContent).join('\n\n'));
    // return chunks.map((chunk: any) => typeof chunk === 'string' ? chunk : chunk.text ?? '');
    throw new Error(
      'Chonkie.js integration is not implemented yet. Use CHUNKING_MODE=langchain or add a Chonkie wrapper here.',
    );
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', ' ', ''],
  });

  const docs = documents.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata ?? {},
  }));

  const chunks = await splitter.splitDocuments(docs as any);

  return chunks.map((chunk) => chunk.pageContent);
}
