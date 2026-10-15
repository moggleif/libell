/**
 * The phone's own voices for spoken guidance (#602). Only an offline voice
 * for the app's language is ever used (ADR 0005); without one, speech is
 * simply unavailable and the tones still work.
 */
import { pickOfflineVoice } from '../domain/spokenGuidance';
import { getLanguage } from './i18n';

function synthesis(): SpeechSynthesis | null {
  return typeof speechSynthesis === 'undefined' ? null : speechSynthesis;
}

/** The installed voice for the app's language, or null. */
export function offlineVoice(): SpeechSynthesisVoice | null {
  const synth = synthesis();
  return synth ? pickOfflineVoice(synth.getVoices(), getLanguage()) : null;
}

/** Browsers list their voices late; `listener` runs whenever the list changes. */
export function onVoicesChanged(listener: () => void): void {
  synthesis()?.addEventListener('voiceschanged', listener);
}
