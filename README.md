# IngestorX

IngestorX este un pipeline TypeScript extensibil pentru ingestia de documente în baze vectoriale. Folosește **LangChain** pentru încărcarea paginilor web și embeddings, permite alegerea între chunking-ul **Chonkie.js** și cel LangChain, iar stocarea este abstractizată printr-o interfață comună.

## Pipeline

`URL → LangChain loader → Chonkie.js / LangChain chunker → OpenAI embeddings → VectorStore → Qdrant`

- **Chonkie.js** (`@chonkiejs/core`): chunking local prin `TokenChunker`, cu overlap și tokenizer bazat pe caractere.
- **LangChain**: Cheerio web loader, RecursiveCharacterTextSplitter și OpenAI embeddings.
- **VectorStore**: interfață cu operații `ensureCollection`, `upsert` și `search`.
- **Qdrant**: adaptor implicit, creează colecția dacă lipsește.
- **LangChain vector stores**: adaptor pentru instanțe compatibile cu `addVectors` și `similaritySearchVectorWithScore`; configurarea providerului rămâne la aplicația gazdă.

> Chonkie TokenChunker folosește un tokenizer bazat pe caractere în configurația implicită; `CHUNK_SIZE` și `CHUNK_OVERLAP` sunt dimensiuni măsurate de acel tokenizer, nu promisiune de tokeni ai modelului de embedding.

## Instalare și configurare

```bash
npm install
cp .env.example .env
```

Setează `OPENAI_API_KEY`. Pentru Qdrant local:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

## Utilizare CLI

```bash
npm run ingest -- https://example.com
```

Variabilele din `.env`:

| Variabilă | Implicit | Descriere |
|---|---:|---|
| `OPENAI_API_KEY` | — | Cheia API pentru embeddings |
| `QDRANT_URL` | `http://localhost:6333` | URL-ul Qdrant |
| `QDRANT_API_KEY` | gol | Cheia Qdrant, dacă este necesară |
| `QDRANT_COLLECTION` | `docs_chunks` | Colecția țintă |
| `CHUNKING_MODE` | `chonkie` | `chonkie` sau `langchain` |
| `CHUNK_SIZE` | `800` | Dimensiunea chunk-ului |
| `CHUNK_OVERLAP` | `120` | Overlap; trebuie să fie sub `CHUNK_SIZE` |
| `INGEST_BATCH_SIZE` | `64` | Numărul de chunk-uri procesate pe lot |

## Folosire din cod și conectare la alt vector store

`ingestUrl` acceptă un `VectorStore` injectat; implementarea trebuie să asigure indexul, să scrie vectori și să returneze rezultatele căutării. Astfel, logica de încărcare, chunking și embedding nu depinde de Qdrant.

```ts
import { ingestUrl } from './src/ingest.js';
import type { VectorStore } from './src/types.js';

const customStore: VectorStore = {
  async ensureCollection(vectorSize) {
    // Creează/verifică indexul în providerul tău.
  },
  async upsert(points) {
    // Persistă id, vector și payload.
  },
  async search(vector, limit) {
    // Returnează [{ id, score, payload }].
    return [];
  },
};

await ingestUrl('https://example.com', { vectorStore: customStore });
```

Pentru un store LangChain existent, `LangChainVectorStoreAdapter` îl adaptează dacă oferă `addVectors` și `similaritySearchVectorWithScore`. Store-ul trebuie creat/configurat de aplicație înainte de injectare.

```ts
import { LangChainVectorStoreAdapter } from './src/vector/langchain-adapter.js';
const vectorStore = new LangChainVectorStoreAdapter(existingLangChainStore);
await ingestUrl('https://example.com', { vectorStore });
```

## Build

```bash
npm run build
```

URL-urile sunt limitate la HTTP/HTTPS. Folosește numai surse pe care ai dreptul să le accesezi și indexezi.
