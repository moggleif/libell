/**
 * The link every simulated box shares: one fixed device id, and in
 * drop mode a lost connection after a while followed by an outage during
 * which the box cannot be reached. Each simulator supplies only what its
 * own box sends and answers.
 */

/** One connection's timers and liveness, handed to the box's `open()`. */
export interface SimulatedSession {
  /** False once the link is lost or deliberately closed. */
  isLive(): boolean;
  /** Run `action` once after `ms`, while the link stays live. */
  after(ms: number, action: () => void): void;
  /** Run `action` every `ms`, while the link stays live. */
  every(ms: number, action: () => void): void;
}

export interface SimulatedBox<Members> {
  deviceId: string;
  /** Drop mode: lose each link after `dropAfterMs`, then stay out of reach
   * for `outageMs`. */
  drop: { dropAfterMs: number; outageMs: number } | null;
  /** The box's own members for one connection. */
  open(session: SimulatedSession): Members;
}

export type SimulatedConnection<Members> = Members & {
  deviceId: string;
  /** A deliberate disconnect, never reported as a lost link. */
  disconnect(): void;
};

export interface SimulatedLink<Members> {
  connect(onDisconnect: () => void): Promise<SimulatedConnection<Members>>;
  /** Like the real transport: resolves null, never rejects, for any
   * other id or while the box is still out of reach after a drop. */
  reconnect(
    deviceId: string,
    onDisconnect: () => void,
  ): Promise<SimulatedConnection<Members> | null>;
}

export function createSimulatedLink<Members>(box: SimulatedBox<Members>): SimulatedLink<Members> {
  // Plain `Date.now()` rather than an injected clock: this never runs in
  // `domain/`, and tests drive it with fake timers, which fake `Date` too.
  let lastDropAt: number | null = null;

  function isInOutage(): boolean {
    return box.drop !== null && lastDropAt !== null && Date.now() - lastDropAt < box.drop.outageMs;
  }

  function open(onDisconnect: () => void): SimulatedConnection<Members> {
    let live = true;
    const timeoutIds: Array<ReturnType<typeof setTimeout>> = [];
    const intervalIds: Array<ReturnType<typeof setInterval>> = [];
    const stop = () => {
      live = false;
      for (const id of timeoutIds) clearTimeout(id);
      for (const id of intervalIds) clearInterval(id);
    };

    if (box.drop) {
      // A lost link stops first and reports second, the order a real GATT
      // loss has; `stop()` alone is the deliberate disconnect.
      timeoutIds.push(
        setTimeout(() => {
          lastDropAt = Date.now();
          stop();
          onDisconnect();
        }, box.drop.dropAfterMs),
      );
    }

    const session: SimulatedSession = {
      isLive: () => live,
      after(ms, action) {
        timeoutIds.push(
          setTimeout(() => {
            if (live) action();
          }, ms),
        );
      },
      every(ms, action) {
        intervalIds.push(
          setInterval(() => {
            if (live) action();
          }, ms),
        );
      },
    };
    return { ...box.open(session), deviceId: box.deviceId, disconnect: stop };
  }

  return {
    connect: (onDisconnect) => Promise.resolve(open(onDisconnect)),
    reconnect: (deviceId, onDisconnect) => {
      if (deviceId !== box.deviceId || isInOutage()) return Promise.resolve(null);
      return Promise.resolve(open(onDisconnect));
    },
  };
}
