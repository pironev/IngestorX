import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { config } from '../config.js';
import type { SourceDocument, TextChunk, TextChunker } from '../types.js';

export class SemanticChunker implements TextChunker {
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    private readonly targetSize: number,
    private readonly overlap: number,
    private readonly similarityThreshold = 0.7,
  ) {
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: config.openAiApiKey });
  }

  async chunk(document: SourceDocument): Promise<TextChunk[]> {
    const paragraphs = this.splitParagraphs(document.pageContent);
    const chunks: TextChunk[] = [];

    for (const paragraph of paragraphs) {
      const sentences = this.splitIntoSentences(paragraph);
      if (sentences.length === 0) {
        continue;
      }

      const sentenceEmbeddings = await this.embeddings.embedDocuments(sentences);
      let current: string[] = [];
      let currentLength = 0;
      let lastEmbedding: number[] | null = null;

      const flush = (text: string, metadata: Record<string, unknown> = {}) => {
        const normalized = text.trim();
        if (!normalized) {
          return;
        }

        chunks.push({
          text: normalized,
          metadata: {
            ...metadata,
            sourceUrl: document.sourceUrl,
            chunker: 'semantic',
          },
        });
      };

      const finalizeCurrent = () => {
        if (current.length === 0) {
          return;
        }

        const text = current.join(' ').trim();
        if (text.length > this.targetSize * 2) {
          const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.targetSize,
            chunkOverlap: this.overlap,
            separators: ['\n\n', '\n', '. ', ' '],
          });

          for (const part of await splitter.splitText(text)) {
            flush(part, { paragraphBreak: true });
          }
          return;
        }

        flush(text, { paragraphBreak: true });
      };

      for (let index = 0; index < sentences.length; index += 1) {
        const sentence = sentences[index].trim();
        if (!sentence) {
          continue;
        }

        if (current.length === 0) {
          current = [sentence];
          currentLength = sentence.length;
          lastEmbedding = sentenceEmbeddings[index] ?? null;
          continue;
        }

        const candidate = `${current.join(' ')} ${sentence}`;
        const nextSentence = index + 1 < sentences.length ? sentences[index + 1].trim() : '';
        const nextEmbedding = index + 1 < sentenceEmbeddings.length ? sentenceEmbeddings[index + 1] : null;

        if (candidate.length > this.targetSize * 2) {
          finalizeCurrent();
          current = [sentence];
          currentLength = sentence.length;
          lastEmbedding = sentenceEmbeddings[index] ?? null;
          continue;
        }

        const shouldKeepTogether =
          (nextEmbedding && lastEmbedding && currentLength >= this.targetSize * 0.7)
            ? this.cosineSimilarity(lastEmbedding, nextEmbedding) >= this.similarityThreshold
            : true;

        const shouldBreakBeforeNext =
          currentLength >= this.targetSize &&
          nextSentence &&
          nextEmbedding &&
          this.cosineSimilarity(sentenceEmbeddings[index], nextEmbedding) < this.similarityThreshold;

        if (shouldBreakBeforeNext) {
          finalizeCurrent();
          current = [sentence];
          currentLength = sentence.length;
          lastEmbedding = sentenceEmbeddings[index] ?? null;
          continue;
        }

        if (!shouldKeepTogether && currentLength >= this.targetSize) {
          finalizeCurrent();
          current = [sentence];
          currentLength = sentence.length;
          lastEmbedding = sentenceEmbeddings[index] ?? null;
          continue;
        }

        current.push(sentence);
        currentLength = current.join(' ').length;
        lastEmbedding = sentenceEmbeddings[index] ?? null;
      }

      finalizeCurrent();
    }

    return chunks.filter((chunk) => chunk.text.length > 0);
  }

  private splitParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n+|\r\n\s*\r\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  private splitIntoSentences(paragraph: string): string[] {
    const matches = paragraph.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];
    return matches
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) {
      return 0;
    }

    let dot = 0;
    let aNorm = 0;
    let bNorm = 0;

    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      aNorm += a[i] * a[i];
      bNorm += b[i] * b[i];
    }

    if (aNorm === 0 || bNorm === 0) {
      return 0;
    }

    return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
  }
}
