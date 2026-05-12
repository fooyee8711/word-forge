# Word Forge Jr.

A mobile-first Next.js + Tailwind sight-word learning app for 5-year-old children, styled like a watercolor children's book.

## What is included

- Welcome → learn new word → mini game → repetition practice → reward animation → review flow.
- Cute animal guide, Otis the fox.
- Browser speech synthesis and speech-recognition practice.
- OpenAI-powered parent coaching route with safe fallback tips.
- Supabase-ready progress persistence route for stars, missions, words, and badges.
- Parent dashboard with progress metrics and ESL-friendly coaching.

## Environment variables

```bash
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Supabase table sketch

```sql
create table child_progress (
  child_id text primary key,
  stars int not null default 0,
  streak int not null default 0,
  words_learned text[] not null default '{}',
  missions_done text[] not null default '{}',
  badges text[] not null default '{}',
  updated_at timestamptz not null default now()
);
```
