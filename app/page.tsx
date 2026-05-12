'use client';

import { useEffect, useMemo, useState } from 'react';

type Stage = 'welcome' | 'learn' | 'game' | 'practice' | 'reward' | 'review' | 'parent';
type Word = {
  text: string;
  emoji: string;
  meaning: string;
  homeLanguage: string;
  sentence: string;
  soundHint: string;
};

type Badge = { icon: string; name: string; detail: string };

type Progress = {
  stars: number;
  streak: number;
  wordsLearned: string[];
  missionsDone: string[];
  badges: string[];
};

const words: Word[] = [
  { text: 'see', emoji: '👀', meaning: 'to look with your eyes', homeLanguage: 'mirar / ver', sentence: 'I see a little fox.', soundHint: 'Long e says eee.' },
  { text: 'the', emoji: '🌈', meaning: 'a special word before a thing', homeLanguage: 'el / la', sentence: 'The bird is blue.', soundHint: 'The starts with a soft th.' },
  { text: 'my', emoji: '🎒', meaning: 'belongs to me', homeLanguage: 'mi', sentence: 'My bag has stars.', soundHint: 'Y says eye in my.' },
  { text: 'we', emoji: '🤝', meaning: 'you and me together', homeLanguage: 'nosotros', sentence: 'We clap for Otis.', soundHint: 'Long e says eee.' },
  { text: 'like', emoji: '💛', meaning: 'to enjoy something', homeLanguage: 'gustar', sentence: 'I like the bunny.', soundHint: 'Silent e helps i say its name.' },
  { text: 'go', emoji: '🚀', meaning: 'to move or leave', homeLanguage: 'ir', sentence: 'Go, turtle, go!', soundHint: 'Long o says oh.' },
];

const missions = [
  'Say today’s magic word 3 times',
  'Feed Otis by choosing 4 correct words',
  'Review 2 sleepy words from yesterday',
];

const badges: Badge[] = [
  { icon: '🦊', name: 'Fox Focus', detail: 'Finished a learn card' },
  { icon: '🐢', name: 'Turtle Tryer', detail: 'Practiced with voice' },
  { icon: '🌟', name: 'Star Reader', detail: 'Won a mini game' },
  { icon: '🎨', name: 'Word Artist', detail: 'Completed the daily mission' },
];

const starterProgress: Progress = {
  stars: 12,
  streak: 3,
  wordsLearned: ['see', 'the'],
  missionsDone: ['Say today’s magic word 3 times'],
  badges: ['Fox Focus'],
};

const stageLabels: Record<Stage, string> = {
  welcome: 'Home',
  learn: 'Learn',
  game: 'Game',
  practice: 'Say It',
  reward: 'Reward',
  review: 'Review',
  parent: 'Parent',
};

export default function Home() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [wordIndex, setWordIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(starterProgress);
  const [voiceMessage, setVoiceMessage] = useState('Tap Otis to hear the word.');
  const [coachTip, setCoachTip] = useState('Use gestures, pictures, and home-language meaning before asking a child to repeat.');

  const currentWord = words[wordIndex];
  const oldWords = words.filter((word) => progress.wordsLearned.includes(word.text));
  const nextBadge = badges.find((badge) => !progress.badges.includes(badge.name)) ?? badges[0];

  const gameChoices = useMemo(() => {
    const distractors = words.filter((word) => word.text !== currentWord.text).slice(0, 2).map((word) => word.text);
    return [currentWord.text, ...distractors].sort();
  }, [currentWord.text]);

  useEffect(() => {
    const stored = window.localStorage.getItem('word-forge-jr-progress');
    if (stored) {
      setProgress(JSON.parse(stored) as Progress);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('word-forge-jr-progress', JSON.stringify(progress));
  }, [progress]);

  function speak(text: string) {
    if (!('speechSynthesis' in window)) {
      setVoiceMessage('Voice playback needs a browser with speech support.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.78;
    utterance.pitch = 1.2;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
    setVoiceMessage(`Otis says: “${text}”`);
  }

  function listenForWord() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage('Try saying it out loud with a grown-up. This browser does not support speech input yet.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceMessage('Otis is listening with big fox ears...');
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const matched = transcript.includes(currentWord.text);
      setVoiceMessage(matched ? 'Wonderful speaking! Otis heard the word.' : `Otis heard “${transcript}”. Try the word ${currentWord.text} again.`);
      if (matched) completePractice();
    };
    recognition.onerror = () => setVoiceMessage('Otis missed that sound. Take a belly breath and try again.');
    recognition.start();
  }

  function chooseAnswer(choice: string) {
    setSelected(choice);
    if (choice === currentWord.text) {
      setProgress((value) => ({
        ...value,
        stars: value.stars + 2,
        wordsLearned: Array.from(new Set([...value.wordsLearned, currentWord.text])),
        badges: Array.from(new Set([...value.badges, 'Star Reader'])),
      }));
      window.setTimeout(() => setStage('practice'), 700);
    }
  }

  function completePractice() {
    setProgress((value) => ({
      ...value,
      stars: value.stars + 1,
      badges: Array.from(new Set([...value.badges, 'Turtle Tryer'])),
    }));
    setStage('reward');
  }

  function finishMission() {
    setProgress((value) => ({
      ...value,
      stars: value.stars + 5,
      missionsDone: Array.from(new Set([...value.missionsDone, missions[1]])),
      badges: Array.from(new Set([...value.badges, 'Word Artist', nextBadge.name])),
    }));
  }

  async function askCoach() {
    setCoachTip('Otis is asking the reading coach...');
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: currentWord.text, homeLanguage: currentWord.homeLanguage }),
    });
    const data = (await response.json()) as { tip?: string };
    setCoachTip(data.tip ?? 'Point, say, repeat, play, and celebrate.');
  }

  function startNextWord() {
    setSelected(null);
    setWordIndex((index) => (index + 1) % words.length);
    setStage('learn');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-28 pt-4 sm:px-6 lg:grid lg:grid-cols-[1.15fr_.85fr] lg:pb-8">
      <section className="watercolor-card paint-edge relative overflow-hidden rounded-[2.2rem] p-5 sm:p-8">
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-pink-200/60 blur-2xl" />
        <div className="absolute bottom-14 left-8 h-24 w-24 rounded-full bg-cyan-200/60 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-600">Sight Word Safari</p>
            <h1 className="mt-2 text-4xl font-black leading-none text-violet-950 sm:text-6xl">Word Forge Jr.</h1>
            <p className="mt-3 max-w-xl text-lg font-bold leading-relaxed text-violet-700">A watercolor storybook adventure where tiny readers learn high-frequency words through sound, movement, rewards, and cozy review.</p>
          </div>
          <button onClick={() => speak(`Hello friend. Today we learn ${currentWord.text}.`)} className="tap-target animate-floaty rounded-[2rem] bg-orange-100 p-3 text-6xl shadow-soft" aria-label="Otis the fox says hello">🦊</button>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 text-center sm:max-w-xl">
          <Stat value={`${progress.stars}`} label="stars" />
          <Stat value={`${progress.streak}`} label="day streak" />
          <Stat value={`${progress.wordsLearned.length}`} label="words" />
        </div>

        {stage === 'welcome' && <WelcomeScreen setStage={setStage} progress={progress} />}
        {stage === 'learn' && <LearnScreen word={currentWord} speak={speak} setStage={setStage} />}
        {stage === 'game' && <GameScreen word={currentWord} choices={gameChoices} selected={selected} chooseAnswer={chooseAnswer} speak={speak} />}
        {stage === 'practice' && <PracticeScreen word={currentWord} speak={speak} listenForWord={listenForWord} completePractice={completePractice} voiceMessage={voiceMessage} />}
        {stage === 'reward' && <RewardScreen badge={nextBadge} finishMission={finishMission} startNextWord={startNextWord} setStage={setStage} />}
        {stage === 'review' && <ReviewScreen words={oldWords.length ? oldWords : words.slice(0, 3)} speak={speak} />}
        {stage === 'parent' && <ParentDashboard progress={progress} coachTip={coachTip} askCoach={askCoach} />}
      </section>

      <aside className="grid gap-4 lg:content-start">
        <section className="watercolor-card rounded-[2rem] p-5">
          <h2 className="text-2xl font-black text-violet-950">Today’s Missions</h2>
          <div className="mt-4 grid gap-3">
            {missions.map((mission, index) => (
              <div key={mission} className="flex items-center gap-3 rounded-3xl bg-white/75 p-3 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-yellow-200 text-xl font-black">{index + 1}</span>
                <div className="flex-1">
                  <p className="font-black text-violet-950">{mission}</p>
                  <p className="text-sm font-bold text-violet-500">{progress.missionsDone.includes(mission) ? 'Done — happy dance!' : 'Ready to play'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="watercolor-card rounded-[2rem] p-5">
          <h2 className="text-2xl font-black text-violet-950">Badge Garden</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {badges.map((badge) => {
              const earned = progress.badges.includes(badge.name);
              return (
                <div key={badge.name} className={`rounded-3xl p-3 text-center ${earned ? 'bg-lime-100 text-emerald-800' : 'bg-white/70 text-violet-400 grayscale'}`}>
                  <div className="text-4xl">{badge.icon}</div>
                  <p className="mt-1 font-black">{badge.name}</p>
                  <p className="text-xs font-bold">{badge.detail}</p>
                </div>
              );
            })}
          </div>
        </section>
      </aside>

      <nav className="fixed bottom-3 left-1/2 z-20 grid w-[min(calc(100%-1rem),620px)] -translate-x-1/2 grid-cols-6 gap-1 rounded-[2rem] border-4 border-white bg-white/95 p-2 shadow-soft lg:hidden" aria-label="Simple navigation">
        {(['welcome', 'learn', 'game', 'practice', 'review', 'parent'] as Stage[]).map((item) => (
          <button key={item} onClick={() => setStage(item)} className={`tap-target rounded-3xl px-1 py-2 text-xs font-black ${stage === item ? 'bg-fuchsia-200 text-fuchsia-900' : 'text-violet-500'}`}>{stageLabels[item]}</button>
        ))}
      </nav>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl bg-white/75 p-3 shadow-sm">
      <p className="text-2xl font-black text-violet-950">{value}</p>
      <p className="text-xs font-black uppercase tracking-wide text-violet-500">{label}</p>
    </div>
  );
}

function WelcomeScreen({ setStage, progress }: { setStage: (stage: Stage) => void; progress: Progress }) {
  return (
    <div className="relative z-10 mt-6 grid gap-4">
      <div className="rounded-[2rem] bg-white/70 p-4">
        <h2 className="text-3xl font-black text-violet-950">Hi, little reader!</h2>
        <p className="mt-2 text-lg font-bold text-violet-700">Otis the fox found a basket of words. Tap one big button at a time: learn, play, say, celebrate, then review.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <BigButton color="bg-yellow-200" icon="✨" title="Start Daily Quest" text="Learn one new word" onClick={() => setStage('learn')} />
        <BigButton color="bg-cyan-200" icon="🔁" title="Review Old Words" text={`${progress.wordsLearned.length} ready`} onClick={() => setStage('review')} />
      </div>
    </div>
  );
}

function LearnScreen({ word, speak, setStage }: { word: Word; speak: (text: string) => void; setStage: (stage: Stage) => void }) {
  return (
    <div className="relative z-10 mt-6 rounded-[2rem] bg-white/70 p-5 text-center">
      <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-600">Learn New Word</p>
      <div className="mt-3 text-7xl">{word.emoji}</div>
      <h2 className="mt-2 text-7xl font-black tracking-wide text-violet-950">{word.text}</h2>
      <p className="mt-2 text-lg font-black text-violet-700">{word.meaning}</p>
      <p className="mt-1 rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">ESL helper: {word.homeLanguage}</p>
      <p className="mt-4 text-xl font-black text-fuchsia-700">“{word.sentence}”</p>
      <p className="mt-2 font-bold text-violet-500">{word.soundHint}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <BigButton color="bg-lime-200" icon="🔊" title="Hear Otis" text="Listen slowly" onClick={() => speak(`${word.text}. ${word.sentence}`)} />
        <BigButton color="bg-pink-200" icon="🎲" title="Play Game" text="Find the word" onClick={() => setStage('game')} />
      </div>
    </div>
  );
}

function GameScreen({ word, choices, selected, chooseAnswer, speak }: { word: Word; choices: string[]; selected: string | null; chooseAnswer: (choice: string) => void; speak: (text: string) => void }) {
  return (
    <div className="relative z-10 mt-6 rounded-[2rem] bg-white/70 p-5">
      <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-600">Mini Game</p>
      <h2 className="mt-2 text-3xl font-black text-violet-950">Feed Otis the word he says.</h2>
      <button onClick={() => speak(word.text)} className="mt-4 w-full rounded-[2rem] bg-orange-100 p-5 text-6xl shadow-inner">🦊 🔊</button>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {choices.map((choice) => {
          const correct = choice === word.text;
          const answered = selected === choice;
          return (
            <button key={choice} onClick={() => chooseAnswer(choice)} className={`tap-target rounded-3xl p-4 text-2xl font-black shadow-sm ${answered && correct ? 'animate-rewardPop bg-lime-200 text-emerald-800' : answered ? 'bg-red-100 text-red-700' : 'bg-cyan-100 text-violet-900'}`}>{choice}</button>
          );
        })}
      </div>
      <p className="mt-4 min-h-7 text-center text-lg font-black text-violet-700">{selected ? (selected === word.text ? 'Yum! Otis found the right word.' : 'Almost. Listen and try again.') : 'Tap the word card.'}</p>
    </div>
  );
}

function PracticeScreen({ word, speak, listenForWord, completePractice, voiceMessage }: { word: Word; speak: (text: string) => void; listenForWord: () => void; completePractice: () => void; voiceMessage: string }) {
  return (
    <div className="relative z-10 mt-6 rounded-[2rem] bg-white/70 p-5 text-center">
      <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-600">Repetition Practice</p>
      <h2 className="mt-2 text-4xl font-black text-violet-950">Say it like a song.</h2>
      <div className="my-5 rounded-[2rem] bg-gradient-to-br from-yellow-100 to-pink-100 p-6 text-7xl font-black text-violet-950">{word.text}</div>
      <div className="grid gap-3 sm:grid-cols-3">
        <BigButton color="bg-cyan-200" icon="👂" title="Hear" text="Otis says it" onClick={() => speak(word.text)} />
        <BigButton color="bg-lime-200" icon="🎙️" title="Speak" text="Use voice" onClick={listenForWord} />
        <BigButton color="bg-yellow-200" icon="👏" title="I Said It" text="Mark done" onClick={completePractice} />
      </div>
      <p className="mt-4 rounded-3xl bg-white/80 p-3 font-black text-violet-700">{voiceMessage}</p>
    </div>
  );
}

function RewardScreen({ badge, finishMission, startNextWord, setStage }: { badge: Badge; finishMission: () => void; startNextWord: () => void; setStage: (stage: Stage) => void }) {
  return (
    <div className="relative z-10 mt-6 rounded-[2rem] bg-white/70 p-5 text-center">
      <div className="animate-sparkle text-3xl">✨ ✨ ✨</div>
      <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-600">Reward Animation</p>
      <div className="mx-auto mt-4 grid h-40 w-40 animate-rewardPop place-items-center rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-cyan-200 text-7xl shadow-soft">{badge.icon}</div>
      <h2 className="mt-4 text-4xl font-black text-violet-950">You earned {badge.name}!</h2>
      <p className="mt-2 font-bold text-violet-600">Stars flutter into your Badge Garden.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <BigButton color="bg-yellow-200" icon="🎯" title="Finish Mission" text="Add reward" onClick={finishMission} />
        <BigButton color="bg-lime-200" icon="➡️" title="Next Word" text="Keep playing" onClick={startNextWord} />
        <BigButton color="bg-cyan-200" icon="🔁" title="Review" text="Old words" onClick={() => setStage('review')} />
      </div>
    </div>
  );
}

function ReviewScreen({ words, speak }: { words: Word[]; speak: (text: string) => void }) {
  return (
    <div className="relative z-10 mt-6 rounded-[2rem] bg-white/70 p-5">
      <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-600">Review Old Words</p>
      <h2 className="mt-2 text-3xl font-black text-violet-950">Sleepy words wake up with one tap.</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {words.map((word) => (
          <button key={word.text} onClick={() => speak(`${word.text}. ${word.sentence}`)} className="rounded-[2rem] bg-white/80 p-4 text-left shadow-sm">
            <span className="text-3xl">{word.emoji}</span>
            <span className="ml-3 text-3xl font-black text-violet-950">{word.text}</span>
            <p className="mt-2 font-bold text-violet-600">{word.sentence}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ParentDashboard({ progress, coachTip, askCoach }: { progress: Progress; coachTip: string; askCoach: () => void }) {
  return (
    <div className="relative z-10 mt-6 rounded-[2rem] bg-white/70 p-5">
      <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-600">Parent Dashboard</p>
      <h2 className="mt-2 text-3xl font-black text-violet-950">Gentle progress, no pressure.</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat value={`${progress.wordsLearned.length}/6`} label="sight words" />
        <Stat value={`${progress.badges.length}`} label="badges" />
        <Stat value={`${progress.missionsDone.length}`} label="missions" />
      </div>
      <div className="mt-4 rounded-3xl bg-violet-50 p-4">
        <h3 className="text-xl font-black text-violet-950">AI reading coach</h3>
        <p className="mt-2 font-bold leading-relaxed text-violet-700">{coachTip}</p>
        <button onClick={askCoach} className="tap-target mt-3 rounded-3xl bg-violet-600 px-5 py-3 font-black text-white shadow-sm">Get ESL-friendly tip</button>
      </div>
      <div className="mt-4 rounded-3xl bg-emerald-50 p-4">
        <h3 className="text-xl font-black text-emerald-900">Supabase ready</h3>
        <p className="mt-2 font-bold text-emerald-700">Local progress syncs in the browser now. Connect Supabase environment variables to save child profiles, missions, and badges across devices.</p>
      </div>
    </div>
  );
}

function BigButton({ color, icon, title, text, onClick }: { color: string; icon: string; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} tap-target rounded-[1.6rem] p-4 text-left font-black text-violet-950 shadow-sm transition hover:-translate-y-0.5 active:scale-95`}>
      <span className="text-3xl">{icon}</span>
      <span className="ml-2 text-lg">{title}</span>
      <span className="mt-1 block text-sm text-violet-600">{text}</span>
    </button>
  );
}

type SpeechRecognitionEventResult = { transcript: string };
type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<SpeechRecognitionEventResult>> };
type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
