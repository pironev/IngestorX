import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import type { VectorStore } from '../types.js';

export class QdrantVectorStore implements VectorStore {
  private readonly client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: config.qdrantUrl,
      apiKey: config.qdrantApiKey || undefined,
    });
  }

  async ensureCollection(vectorSize: number): Promise<void> {
    try {
      await this.client.getCollection(config.qdrantCollection);
    } catch {
      await this.client.createCollection(config.qdrantCollection, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
    }
  }

  async upsert(
    points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>,
  ): Promise<void> {
    await this.client.upsert(config.qdrantCollection, {
      wait: true,
      points,
    });
  }
}
