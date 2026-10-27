/**
 * The connect, reconnect and disconnect flow every BLE box link shares, on
 * top of the transport in `webBluetoothLink.ts`: try the transport, adopt
 * what it hands back, and settle on the state the UI shows. Each box
 * supplies only what is its own: how it adopts a connection, what a lost
 * link clears, and whether it refuses to connect at all.
 */
import type { SensorState } from './orientation';

/** The part of a box's link this flow reads and writes. */
export interface BoxLinkState {
  state: SensorState;
  connection: { disconnect(): void } | null;
}

/** What one kind of box adds to the shared flow. */
export interface BoxLinkSteps<Link extends BoxLinkState, Connection> {
  /** The state to report instead of connecting, or null to go ahead. */
  refusal?(link: Link): SensorState | null;
  /** Take over a fresh connection. A failure here counts as no connection. */
  adopt(link: Link, connection: Connection): Promise<SensorState>;
  /** The link was lost: stop, clear the readings, report `'disconnected'`. */
  markLost(link: Link): void;
}

/** The transport calls a box's link is opened through. */
export interface BoxTransport<Connection> {
  connect(onDisconnect: () => void): Promise<Connection>;
  reconnect(deviceId: string, onDisconnect: () => void): Promise<Connection | null>;
}

/** The OS picker, then the box's own adoption. */
export async function connectWithPicker<Link extends BoxLinkState, Connection>(
  link: Link,
  steps: BoxLinkSteps<Link, Connection>,
  transport: BoxTransport<Connection>,
): Promise<SensorState> {
  const refusal = steps.refusal?.(link);
  if (refusal) return refusal;
  try {
    return await steps.adopt(link, await transport.connect(() => steps.markLost(link)));
  } catch {
    // A cancelled picker and a failed connect are the same to the caller,
    // like a denied phone permission. A box already lost stays lost, so a
    // cancelled Retry picker keeps the unavailable prompt and its
    // background retry.
    if (link.state !== 'disconnected') link.state = 'denied';
    return link.state;
  }
}

/** No picker and no gesture: anything short of a live link is `'disconnected'`. */
export async function reconnectSilently<Link extends BoxLinkState, Connection>(
  link: Link,
  steps: BoxLinkSteps<Link, Connection>,
  transport: BoxTransport<Connection>,
  deviceId: string,
): Promise<SensorState> {
  const refusal = steps.refusal?.(link);
  if (refusal) return refusal;
  try {
    const next = await transport.reconnect(deviceId, () => steps.markLost(link));
    if (next) return await steps.adopt(link, next);
  } catch {
    // Silent by design, like a box that cannot be found.
  }
  link.state = 'disconnected';
  return link.state;
}

/** The user's own disconnect: everything a lost link clears, then idle.
 * The transport's teardown reports nothing through `onDisconnect`. */
export function disconnectByUser<Link extends BoxLinkState, Connection>(
  link: Link,
  steps: BoxLinkSteps<Link, Connection>,
): void {
  const live = link.connection;
  steps.markLost(link);
  link.connection = null;
  link.state = 'idle';
  live?.disconnect();
}
