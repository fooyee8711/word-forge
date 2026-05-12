import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type ChildProgress = {
  childId?: string;
  stars?: number;
  streak?: number;
  wordsLearned?: string[];
  missionsDone?: string[];
  badges?: string[];
};

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChildProgress;
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ saved: false, note: 'Set Supabase environment variables to persist progress.' });
  }

  const { error } = await supabase.from('child_progress').upsert({
    child_id: body.childId ?? 'demo-child',
    stars: body.stars ?? 0,
    streak: body.streak ?? 0,
    words_learned: body.wordsLearned ?? [],
    missions_done: body.missionsDone ?? [],
    badges: body.badges ?? [],
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ saved: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
