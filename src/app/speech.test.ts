import { describe, expect, it } from 'vitest';
import { createSpeaker, type SpeechPort } from './speech';

interface Said {
  text: string;
  voice?: SpeechSynthesisVoice | null;
  lang?: string;
}

const SWEDISH = { lang: 'sv-SE', localService: true } as SpeechSynthesisVoice;

function fakeSpeech(voice: SpeechSynthesisVoice | null) {
  const said: Said[] = [];
  let cancels = 0;
  const port: SpeechPort = {
    synth: {
      speak: (utterance) => void said.push(utterance as unknown as Said),
      cancel: () => void (cancels += 1),
      getVoices: () => (voice ? [voice] : []),
    },
    voice: () => voice,
    utterance: (text) => ({ text }) as unknown as SpeechSynthesisUtterance,
  };
  return { port, said, cancels: () => cancels };
}

describe('createSpeaker (#602)', () => {
  it('says the text in the offline voice, cutting off what was being said', () => {
    const { port, said, cancels } = fakeSpeech(SWEDISH);
    createSpeaker(port).say('Vänster bak, Steg 2');
    expect(said).toEqual([{ text: 'Vänster bak, Steg 2', voice: SWEDISH, lang: 'sv-SE' }]);
    expect(cancels()).toBe(1);
  });

  it('stays silent without an offline voice for the language', () => {
    const { port, said } = fakeSpeech(null);
    createSpeaker(port).say('Plant');
    expect(said).toEqual([]);
  });

  it('does nothing where the browser has no speech synthesis', () => {
    const speaker = createSpeaker({ synth: null, voice: () => SWEDISH, utterance: () => null! });
    expect(() => {
      speaker.unlock();
      speaker.say('Plant');
    }).not.toThrow();
  });

  it('unlocks by speaking an empty phrase inside the gesture, once', () => {
    const { port, said } = fakeSpeech(SWEDISH);
    const speaker = createSpeaker(port);
    speaker.unlock();
    speaker.unlock();
    expect(said).toEqual([{ text: '' }]);
  });
});
