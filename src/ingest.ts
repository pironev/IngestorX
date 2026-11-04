import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { OpenAIEmbeddings } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { config, assertConfig } from './config.js';
import { chunkDocuments } from './chunking/index.js';
import { QdrantVectorStore } from './vector/qdrant.js';
import type { SourceDocument } from './types.js';

export async function ingestUrl(url: string) {
  assertConfig();

  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();

  const sourceDocs: SourceDocument[] = docs.map((doc) => ({
    sourceUrl: url,
    pageContent: doc.pageContent,
    metadata: doc.metadata ?? {},
  }));

  const texts = await chunkDocuments(
    sourceDocs,
    config.chunkingMode as 'langchain' | 'chonkie',
    config.chunkSize,
    config.chunkOverlap,
  );

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAiApiKey,
  });

  const vectors = await embeddings.embedDocuments(texts);

  const vectorStore = new QdrantVectorStore();
  await vectorStore.ensureCollection(vectors[0]?.length ?? 1536);

  const points = texts.map((text, index) => ({
    id: uuidv4(),
    vector: vectors[index],
    payload: {
      sourceUrl: url,
      text,
      chunkIndex: index,
      createdAt: new Date().toISOString(),
    },
  }));

  await vectorStore.upsert(points);

  return {
    sourceUrl: url,
    chunks: texts.length,
    collection: config.qdrantCollection,
  };
}
