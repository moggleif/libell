/**
 * Spoken guidance's voice (#602): the browser's speech synthesis with the
 * phone's own offline voice, or silence when there is none.
 */
import { offlineVoice } from '../ui/speechSupport';

export interface Speaker {
  /** iOS speaks only after speech has started inside a gesture once. */
  unlock(): void;
  /** Says `text`, cutting off anything still being said. */
  say(text: string): void;
}

export interface SpeechPort {
  synth: Pick<SpeechSynthesis, 'speak' | 'cancel' | 'getVoices'> | null;
  voice: () => SpeechSynthesisVoice | null;
  utterance: (text: string) => SpeechSynthesisUtterance;
}

function browserSpeech(): SpeechPort {
  const available =
    typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  return {
    synth: available ? speechSynthesis : null,
    voice: offlineVoice,
    utterance: (text) => new SpeechSynthesisUtterance(text),
  };
}

export function createSpeaker({ synth, voice, utterance }: SpeechPort = browserSpeech()): Speaker {
  // Asking once makes browsers that list voices late start loading them.
  synth?.getVoices();
  let unlocked = false;
  return {
    unlock() {
      if (!synth || unlocked) return;
      unlocked = true;
      synth.speak(utterance(''));
    },
    say(text) {
      const chosen = voice();
      if (!synth || !chosen) return;
      synth.cancel();
      const spoken = utterance(text);
      spoken.voice = chosen;
      spoken.lang = chosen.lang;
      synth.speak(spoken);
    },
  };
}
