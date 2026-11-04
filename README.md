# IngestorX

IngestorX este un starter TypeScript pentru ingestie de documente web și chunk-uri în baze vectoriale, cu suport pentru:

- LangChain pentru loaders + chunking
- Chonkie.js hook pentru chunking alternativ
- OpenAI embeddings
- Qdrant ca vector store
- extensie pentru alte baze vectoriale

## Ce face

- extrage text din URL-uri web
- împarte documentul în chunk-uri
- generează embedding-uri
- salvează în Qdrant
- poți extinde cu MongoDB, Pinecone, Weaviate, Milvus etc.

## Structura proiectului

- `src/index.ts` – CLI entrypoint
- `src/ingest.ts` – logica principală de ingest
- `src/config.ts` – variabile de mediu
- `src/chunking/index.ts` – wrapper pentru chunking
- `src/vector/qdrant.ts` – client Qdrant
- `src/types.ts` – tipuri centrale

## Instalare

```bash
npm install
cp .env.example .env
```

Apoi completează variabilele din `.env`.

## Pornire Qdrant local

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

## Exemplu de ingestie

```bash
npm run ingest -- https://example.com
```

## Build

```bash
npm run build
```

## Notes

- Mod implicit: `CHUNKING_MODE=langchain`
- Puteți înlocui chunking-ul cu un wrapper Chonkie.js în `src/chunking/index.ts`
- Interfața VectorStore e gata de extindere pentru alte baze vectoriale

## Exemplu de integrare Chonkie

În `src/chunking/index.ts` poți injecta o implementare Chonkie fără să schimbi logica de ingestie.

```ts
if (mode === 'chonkie') {
  // return await chonkieChunk(text)
}
```
