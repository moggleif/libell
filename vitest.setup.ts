// Runs after vitest.locale.ts, so the language the tests start in is the
// fixed locale's. The app loads only its own language's dictionary at start
// (ADR 0024); the tests switch language freely, so every dictionary is loaded
// up front.
import { LANGUAGES, loadDictionary } from './src/ui/i18n';

await Promise.all(LANGUAGES.map(loadDictionary));
