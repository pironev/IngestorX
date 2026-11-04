import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import type { VectorPoint, VectorSearchResult, VectorStore } from '../types.js';

export class QdrantVectorStore implements VectorStore {
  private readonly client: QdrantClient;

  constructor(
    private readonly collection = config.qdrantCollection,
    client = new QdrantClient({
      url: config.qdrantUrl,
      apiKey: config.qdrantApiKey || undefined,
    }),
  ) {
    this.client = client;
  }

  async ensureCollection(vectorSize: number): Promise<void> {
    const { collections } = await this.client.getCollections();
    if (collections.some(({ name }) => name === this.collection)) return;

    await this.client.createCollection(this.collection, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
  }

  async upsert(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return;
    await this.client.upsert(this.collection, {
      wait: true,
      points: points.map(({ id, vector, payload }) => ({ id, vector, payload })),
    });
  }

  async search(vector: number[], limit: number): Promise<VectorSearchResult[]> {
    const results = await this.client.search(this.collection, { vector, limit, with_payload: true });
    return results.map((point) => ({
      id: String(point.id),
      score: point.score,
      payload: (point.payload ?? {}) as Record<string, unknown>,
    }));
  }
}
