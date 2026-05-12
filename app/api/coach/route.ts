import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const fallbackTips: Record<string, string> = {
  see: 'Show two picture cards, say “I see ___,” then let your child point before reading the word.',
  the: 'Use “the” with favorite toys: the bear, the cup, the shoe. Keep it playful and concrete.',
  my: 'Touch your chest for “my,” then let your child choose a loved item and say “my ___.”',
};

export async function POST(request: Request) {
  const { word, homeLanguage } = (await request.json()) as { word?: string; homeLanguage?: string };
  const safeWord = word ?? 'see';

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      tip: fallbackTips[safeWord] ?? `Pair ${safeWord} with a picture, a gesture, and the home-language bridge ${homeLanguage ?? ''}.`,
      source: 'fallback',
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'system',
        content: 'You are a warm early-literacy coach. Give one practical, ESL-friendly, age-5 sight-word activity in under 35 words. No jargon.',
      },
      {
        role: 'user',
        content: `Sight word: ${safeWord}. Home language bridge: ${homeLanguage ?? 'not provided'}.`,
      },
    ],
  });

  return NextResponse.json({ tip: response.output_text, source: 'openai' });
}
