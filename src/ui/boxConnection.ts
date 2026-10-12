/**
 * The one verdict both a box's card (`sensorSourceSection.ts`) and its own
 * page (`boxStatusPage.ts`) draw from.
 */
import type { SensorState } from '../sensor/orientation';

export type BoxConnection = 'notConnected' | 'lost' | 'password' | 'connected';

/**
 * Checked in this order so a lost box never asks for its password.
 * `isPasswordRejected` is only asked for a box that is in use and in contact.
 */
export function boxConnection(
  isActive: boolean,
  state: SensorState,
  isPasswordRejected: () => boolean,
): BoxConnection {
  if (!isActive) return 'notConnected';
  if (state === 'disconnected') return 'lost';
  if (isPasswordRejected()) return 'password';
  return 'connected';
}
