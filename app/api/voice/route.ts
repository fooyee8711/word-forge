import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get('audio');

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Upload an audio file named audio.' }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ transcript: '', note: 'Set OPENAI_API_KEY to enable server voice transcription.' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcript = await openai.audio.transcriptions.create({
    file: audio,
    model: 'gpt-4o-mini-transcribe',
  });

  return NextResponse.json({ transcript: transcript.text });
}
