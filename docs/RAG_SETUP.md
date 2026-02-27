# RAG Setup: YouTube Playlist → Vector DB → Telegram ICT Agent

This guide implements **Retrieval-Augmented Generation (RAG)** so your Telegram AI agent answers using knowledge extracted from a YouTube playlist (e.g. ICT-style trading content).

## Overview

1. **Ingestion (one-time only):** Run once per playlist. Extract transcripts → chunk → embed → store in a vector database. Playlists don’t need to be refreshed.
2. **At reply time:** When a user messages the bot, search the vector DB for relevant chunks → pass them as context to the AI → generate the reply.

## Choose Your Vector Database

| Option | Pros | Cons |
|--------|------|------|
| **Supabase (pgvector)** | Free tier, SQL + vectors in one place, n8n has a Vector Store node | You create the table and enable pgvector |
| **Pinecone** | Purpose-built for vectors, n8n Pinecone node | Separate service, free tier has limits |

**Recommendation:** Use **Supabase** if you want one place for app data + vectors; use **Pinecone** if you prefer a dedicated vector API.

---

## Option A: Supabase (pgvector)

### 1. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and create a project.
- Note: **Project URL**, **anon/service key** (Settings → API).

### 2. Enable pgvector and create the table

In Supabase **SQL Editor** run:

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing transcript chunks (or FAQs) and their embeddings
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),  -- OpenAI text-embedding-3-small; use 3072 for large
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON public.documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Optional: RLS (allow anon to read for n8n)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for service" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow insert for service" ON public.documents FOR INSERT WITH CHECK (true);
```

- **Embedding size:** `1536` for OpenAI `text-embedding-3-small` (or `ada-002`); change if you use another model.

### 3. RPC for similarity search (so the Telegram agent can retrieve)

PostgREST doesn’t support vector operators directly; use an RPC. In Supabase SQL Editor run:

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM public.documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

Then the Telegram workflow can call `POST /rest/v1/rpc/match_documents` with body `{ "query_embedding": [0.1, ...], "match_count": 5 }` after embedding the user message.

### 3. n8n credentials

- In n8n: **Credentials → Add → Supabase**.
- Fill **Host** (e.g. `xxxx.supabase.co`), **Service Role Key** (so n8n can read/write).

---

## Option B: Pinecone

- Create an index at [pinecone.io](https://pinecone.io) (e.g. dimension `1536`, metric `cosine`).
- In n8n: **Credentials → Pinecone API** with your API key and environment.

---

## Ingestion Workflow (YouTube Playlist → Vectors)

Use the workflow in **`n8n-youtube-playlist-rag-ingestion-workflow.json`**.

### Steps in the workflow

1. **Trigger:** Manual only. Run the workflow once per playlist; no schedule needed.
2. **Get playlist content:**
   - **Apify:** Use an actor that returns video IDs + transcripts (e.g. “YouTube Playlist Extractor” or “YouTube Transcript Scraper” with a list of video URLs).
   - Alternatively: **HTTP Request** to YouTube Data API for playlist items, then another node/Apify to fetch transcript per video.
3. **Loop** over each video/transcript.
4. **Chunk or summarize:**
   - **Option A:** Split transcript into chunks (e.g. 500–800 chars with overlap) so each chunk fits in context.
   - **Option B:** Use an **AI node** (e.g. OpenAI/DeepSeek) with prompt: *“From this transcript extract 5–10 short Q&A pairs or key concepts. Output one pair per line: Q: ... A: ...”*
5. **Embed:** Use **OpenAI Embeddings** (or another embedding node) to get a vector for each chunk/FAQ. (DeepSeek doesn’t expose embeddings; use OpenAI for this step or another embedding API.)
6. **Upsert:** **Supabase Vector Store** (or **Pinecone**) → “Insert” / “Upsert” with `content` + `embedding` (and optional `metadata`: video_id, title, source).

### Apify actors (examples)

- **Playlist → video list:** Search Apify for “YouTube playlist” to get video IDs/URLs.
- **Transcripts:** e.g. `thescrapelab/apify-youtube-transcript-scraper-2-0` or `automation-lab/youtube-transcript` (input: video URL or ID).

You need an **Apify API token** (Apify Console → Integrations → API Token) and the **Apify** community node in n8n (`@apify/n8n-nodes-apify`).

**One-time only:** Run the ingestion workflow once per playlist (change the playlist URL in the Set node, then Execute). Each run appends to the same vector table. No schedule or refresh needed.

---

## Connect RAG to the Telegram ICT Agent

Goal: when a user sends a message, **retrieve** relevant chunks from the vector DB, then **inject** them into the prompt so the AI answers from that knowledge.

### Option 1: RAG inside the same Telegram workflow

In your **Telegram ICT Advisor** workflow:

1. After **Extract Message**, add a branch or sequence that:
   - Takes the user message `extract.text`.
   - **Embeds** it (OpenAI Embeddings node).
   - **Queries** Supabase (or Pinecone) for top-k similar documents (e.g. 3–5).
2. In **Build ICT Prompt**, extend the system or user prompt with:
   - *“Use the following excerpts from the knowledge base when relevant:”*
   - Then paste the `content` of the retrieved chunks.
3. Keep the rest of the flow (AI Agent, Parse Reply, Respond to Webhook) as is.

So the AI always sees: *system instructions + retrieved chunks + user message (+ optional trade data)*.

### Option 2: Use n8n’s “Document Loader” + “Vector Store” as a tool

- Add a **Supabase Vector Store** (or Pinecone) **retriever** as a **tool** of the AI Agent.
- The agent can then “search the knowledge base” when needed. This is cleaner if you use a single AI Agent node that supports tools.

### Embedding model

- Use **OpenAI `text-embedding-3-small`** (or `ada-002`) for both ingestion and query. Same dimension in DB and in the “query” step (e.g. 1536).
- Store your OpenAI API key in n8n credentials; you can use OpenAI only for embeddings and still use DeepSeek for the chat reply.

---

## Checklist

- [ ] Supabase project (or Pinecone index) created
- [ ] pgvector table (or Pinecone index) created and indexed
- [ ] n8n credentials: Supabase (or Pinecone) + OpenAI (for embeddings) + Apify (for YouTube)
- [ ] Ingestion workflow imported; run it **once** per playlist (playlist URL → transcripts → chunks → embed → upsert). No need to run again unless you add a new playlist.
- [ ] Telegram ICT workflow updated: query vector store with user message → inject results into prompt (or add vector store as agent tool)

---

## Optional: NotebookLM

As in your idea: you can use **NotebookLM** (paste playlist links) to quickly build a searchable knowledge base and see which FAQs or quotes are useful, then manually add the best ones into your vector DB or use them to tune the “summarize into FAQs” prompt in the ingestion workflow.
