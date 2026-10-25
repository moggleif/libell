/**
 * The one `sessionStorage` mark (see `src/ui/reopenSettings.ts`). Its key
 * lives here so the stored-data catalogue (#678) can list and delete it.
 */
import type { StoredKey } from './storedKeys';

export const REOPEN_SETTINGS_KEY = 'libell.reopenSettings';

export function sessionStoredKeys(): StoredKey[] {
  return [{ key: REOPEN_SETTINGS_KEY, kind: 'note', session: true }];
}
