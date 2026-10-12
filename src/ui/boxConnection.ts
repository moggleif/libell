/**
 * How a box stands with Libell (#416): the one verdict both its card on the
 * list (`sensorSourceSection.ts`) and its own page (`boxStatusPage.ts`)
 * draw from.
 */
import type { SensorState } from '../sensor/orientation';

/** Not in use, lost contact, wrong password, or connected (#314, #367). */
export type BoxConnection = 'notConnected' | 'lost' | 'password' | 'connected';

/**
 * Not in use, lost contact, rejecting its password, or connected — in that
 * order, so a lost box never asks for its password. `isPasswordRejected`
 * is only asked for a box that is in use and in contact.
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
