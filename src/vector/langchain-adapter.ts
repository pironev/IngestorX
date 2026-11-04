import { Document } from '@langchain/core/documents';
import type { VectorPoint, VectorSearchResult, VectorStore } from '../types.js';

/**
 * Adapter for LangChain vector stores exposing addVectors and
 * similaritySearchVectorWithScore (for example Chroma, Pinecone, or Weaviate).
 * Configure/create the underlying store with its provider SDK first.
 */
export interface LangChainVectorStoreLike {
  addVectors(vectors: number[][], documents: Document[]): Promise<unknown>;
  similaritySearchVectorWithScore(query: number[], k: number): Promise<[Document, number][]>;
}

export class LangChainVectorStoreAdapter implements VectorStore {
  constructor(private readonly store: LangChainVectorStoreLike) {}

  async ensureCollection(_vectorSize: number): Promise<void> {
    // Collection/index provisioning is provider-specific and handled by the supplied store.
  }

  async upsert(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return;
    const documents = points.map(({ id, payload }) => new Document({
      pageContent: String(payload.text ?? ''),
      metadata: { ...payload, id },
    }));
    await this.store.addVectors(points.map(({ vector }) => vector), documents);
  }

  async search(vector: number[], limit: number): Promise<VectorSearchResult[]> {
    const matches = await this.store.similaritySearchVectorWithScore(vector, limit);
    return matches.map(([document, score], index) => ({
      id: String(document.metadata.id ?? index),
      score,
      payload: { ...document.metadata, text: document.pageContent },
    }));
  }
}
