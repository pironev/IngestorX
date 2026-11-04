import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { OpenAIEmbeddings } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';
import { createChunker } from './chunking/index.js';
import { assertConfig, type SourceDocument, type VectorStore } from './types.js';
import { QdrantVectorStore } from './vector/qdrant.js';

export interface IngestOptions {
  vectorStore?: VectorStore;
  batchSize?: number;
}

export async function ingestUrl(url: string, options: IngestOptions = {}) {
  assertConfig();
  const parsedUrl = new URL(url);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only http and https URLs are supported.');
  }

  const loader = new CheerioWebBaseLoader(parsedUrl.toString());
  const loadedDocs = await loader.load();
  const documents: SourceDocument[] = loadedDocs.map((doc) => ({
    sourceUrl: parsedUrl.toString(),
    pageContent: doc.pageContent,
    metadata: doc.metadata as Record<string, unknown>,
  })).filter((doc) => doc.pageContent.trim().length > 0);

  const chunker = createChunker(config.chunkingMode, config.chunkSize, config.chunkOverlap);
  const chunks = (await Promise.all(documents.map((document) => chunker.chunk(document)))).flat();
  if (chunks.length === 0) return { sourceUrl: parsedUrl.toString(), chunks: 0, collection: config.qdrantCollection };

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: config.openAiApiKey });
  const vectorStore = options.vectorStore ?? new QdrantVectorStore();
  const batchSize = options.batchSize ?? config.batchSize;
  let indexed = 0;

  for (let offset = 0; offset < chunks.length; offset += batchSize) {
    const batch = chunks.slice(offset, offset + batchSize);
    const vectors = await embeddings.embedDocuments(batch.map((chunk) => chunk.text));
    if (vectors.length === 0) continue;
    await vectorStore.ensureCollection(vectors[0].length);
    await vectorStore.upsert(batch.map((chunk, index) => ({
      id: uuidv4(),
      vector: vectors[index],
      payload: {
        ...chunk.metadata,
        sourceUrl: parsedUrl.toString(),
        text: chunk.text,
        createdAt: new Date().toISOString(),
      },
    })));
    indexed += batch.length;
  }

  return { sourceUrl: parsedUrl.toString(), chunks: indexed, collection: config.qdrantCollection };
}
